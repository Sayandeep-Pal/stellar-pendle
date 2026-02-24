
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, vec, Val, Vec
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    StUsdcAddress,
    Maturity,
    OracleAddress,           // NEW: To store your Bridge/Oracle contract address
    PtBalance(Address),
    YtBalance(Address),
    UserEntryIndex(Address), // REPLACED LastClaimRate to match your new logic
    TotalPT, 
    TotalYT,
}

#[contract]
pub struct StUsdcPendleWrapper;

// Matches the 7 decimals from your Oracle contract (10_000_000 = 1.0)
const INDEX_SCALAR: i128 = 10_000_000; 

#[contractimpl]
impl StUsdcPendleWrapper {
    /// NEW: Added `oracle_address` to the initialization so the contract knows where to pull the index from.
    pub fn initialize(env: Env, stusdc_address: Address, maturity_timestamp: u64, oracle_address: Address) {
        env.storage().persistent().set(&DataKey::StUsdcAddress, &stusdc_address);
        env.storage().persistent().set(&DataKey::Maturity, &maturity_timestamp);
        env.storage().persistent().set(&DataKey::OracleAddress, &oracle_address);
    }

    pub fn transfer_pt(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth(); 
        
        let from_bal = Self::get_pt_balance(env.clone(), from.clone());
        if from_bal < amount { panic!("Insufficient PT balance"); }

        let to_bal = Self::get_pt_balance(env.clone(), to.clone());

        env.storage().persistent().set(&DataKey::PtBalance(from), &(from_bal - amount));
        env.storage().persistent().set(&DataKey::PtBalance(to), &(to_bal + amount));
    }

    pub fn transfer_yt(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        let from_bal = Self::get_yt_balance(env.clone(), from.clone());
        if from_bal < amount { panic!("Insufficient YT balance"); }

        let to_bal = Self::get_yt_balance(env.clone(), to.clone());

        env.storage().persistent().set(&DataKey::YtBalance(from), &(from_bal - amount));
        env.storage().persistent().set(&DataKey::YtBalance(to), &(to_bal + amount));
    }

    /// Step 1: Wrap & Split
    pub fn mint_split(env: Env, user: Address, amount: i128) {
        user.require_auth();
        let stusdc_addr: Address = env.storage().persistent().get(&DataKey::StUsdcAddress).unwrap();
        let oracle_addr: Address = env.storage().persistent().get(&DataKey::OracleAddress).unwrap();
        
        // 1. Pull stUSDC from user
        token::Client::new(&env, &stusdc_addr).transfer(&user, &env.current_contract_address(), &amount);

        // 2. Fetch the CURRENT yield index from the Bridge/Oracle contract
        let current_index: i128 = env.invoke_contract(
            &oracle_addr, 
            &Symbol::new(&env, "get_yield_index"), 
            vec![&env]
        );
        
        // Save this index as the user's starting point
        env.storage().persistent().set(&DataKey::UserEntryIndex(user.clone()), &current_index);

        // 3. Update User Balances
        let pt_bal = Self::get_pt_balance(env.clone(), user.clone());
        let yt_bal = Self::get_yt_balance(env.clone(), user.clone());
        env.storage().persistent().set(&DataKey::PtBalance(user.clone()), &(pt_bal + amount));
        env.storage().persistent().set(&DataKey::YtBalance(user.clone()), &(yt_bal + amount));

        // 4. Update Global Supply
        let current_total_pt: i128 = env.storage().instance().get(&DataKey::TotalPT).unwrap_or(0);
        let current_total_yt: i128 = env.storage().instance().get(&DataKey::TotalYT).unwrap_or(0);

        env.storage().instance().set(&DataKey::TotalPT, &(current_total_pt + amount));
        env.storage().instance().set(&DataKey::TotalYT, &(current_total_yt + amount));
    }

    /// Step 2: Redeem Principal (Only after Maturity)
    pub fn redeem_pt(env: Env, user: Address, amount_pt: i128) {
        user.require_auth();
        let maturity: u64 = env.storage().persistent().get(&DataKey::Maturity).unwrap_or(0);
        if env.ledger().timestamp() < maturity { panic!("Wait for maturity"); }

        let pt_bal = Self::get_pt_balance(env.clone(), user.clone());
        if pt_bal < amount_pt { panic!("Insufficient PT"); }

        // BURN PT ONLY 
        env.storage().persistent().set(&DataKey::PtBalance(user.clone()), &(pt_bal - amount_pt));

        // Decrease Global PT Supply
        let current_total_pt: i128 = env.storage().instance().get(&DataKey::TotalPT).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalPT, &(current_total_pt - amount_pt));

        // Return the stUSDC
        let stusdc_addr: Address = env.storage().persistent().get(&DataKey::StUsdcAddress).unwrap();
        token::Client::new(&env, &stusdc_addr).transfer(&env.current_contract_address(), &user, &amount_pt);
    }

    /// Step 3: Claim Yield
    pub fn claim_yield(env: Env, user: Address) {
        user.require_auth();
        let yt_bal = Self::get_yt_balance(env.clone(), user.clone());
        if yt_bal <= 0 { panic!("No yield to claim"); }

        let stusdc_addr: Address = env.storage().persistent().get(&DataKey::StUsdcAddress).unwrap();
        let oracle_addr: Address = env.storage().persistent().get(&DataKey::OracleAddress).unwrap();

        // 1. Fetch current index and the user's stored index
        let current_index: i128 = env.invoke_contract(
            &oracle_addr, 
            &Symbol::new(&env, "get_yield_index"), 
            vec![&env]
        );
        let stored_index: i128 = env.storage().persistent().get(&DataKey::UserEntryIndex(user.clone())).unwrap_or(INDEX_SCALAR);
        
        // 2. Calculate Yield Percentage and Profit
        // Formula: (YT Balance * (Current Index - Stored Index)) / 10_000_000
        let rate_gain = current_index - stored_index;
        
        if rate_gain <= 0 { panic!("No new yield generated yet"); }
        
        let profit = (yt_bal * rate_gain) / INDEX_SCALAR;

        // BURN ALL YT
        env.storage().persistent().set(&DataKey::YtBalance(user.clone()), &0i128);

        // Decrease Global YT Supply
        let current_total_yt: i128 = env.storage().instance().get(&DataKey::TotalYT).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalYT, &(current_total_yt - yt_bal));

        // Pay out profit in stUSDC
        if profit > 0 {
            token::Client::new(&env, &stusdc_addr).transfer(&env.current_contract_address(), &user, &profit);
            env.events().publish((Symbol::new(&env, "yield_pay"), user), profit);
        }
    }
    
    /// Step 4: Early Exit (Redeem with both PT and YT)
    pub fn combine_and_redeem(env: Env, user: Address, amount: i128) {
        user.require_auth();

        let pt_key = DataKey::PtBalance(user.clone());
        let yt_key = DataKey::YtBalance(user.clone());
        
        let pt_bal = env.storage().persistent().get(&pt_key).unwrap_or(0i128);
        let yt_bal = env.storage().persistent().get(&yt_key).unwrap_or(0i128);

        if pt_bal < amount || yt_bal < amount {
            panic!("You need both PT and YT to redeem early");
        }

        // Burn both tokens
        env.storage().persistent().set(&pt_key, &(pt_bal - amount));
        env.storage().persistent().set(&yt_key, &(yt_bal - amount));

        // Decrease BOTH Global Supplies
        let current_total_pt: i128 = env.storage().instance().get(&DataKey::TotalPT).unwrap_or(0);
        let current_total_yt: i128 = env.storage().instance().get(&DataKey::TotalYT).unwrap_or(0);

        env.storage().instance().set(&DataKey::TotalPT, &(current_total_pt - amount));
        env.storage().instance().set(&DataKey::TotalYT, &(current_total_yt - amount));
        
        // Return the stUSDC 1:1
        let stusdc_addr: Address = env.storage().persistent().get(&DataKey::StUsdcAddress).unwrap();
        token::Client::new(&env, &stusdc_addr).transfer(&env.current_contract_address(), &user, &amount);
    }

    // --- VIEW FUNCTIONS ---
    pub fn get_pt_balance(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::PtBalance(user)).unwrap_or(0)
    }

    pub fn get_yt_balance(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::YtBalance(user)).unwrap_or(0)
    }

    pub fn get_total_pt_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalPT).unwrap_or(0) 
    }

    pub fn get_total_yt_supply(env: Env) -> i128 {
         env.storage().instance().get(&DataKey::TotalYT).unwrap_or(0)
    }
}