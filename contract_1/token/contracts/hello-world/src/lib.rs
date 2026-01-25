#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Symbol
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Asset, // XLM Token Address
    Balance(Address), // Fixed: Now tracks individual balances
}

#[contract]
pub struct YieldVault;

// Range constants for the random yield rate
const MIN_RATE: u64 = 1000; // 1.0x (No gain)
const MAX_RATE: u64 = 1100; // 1.1x (10% max gain)

#[contractimpl]
impl YieldVault {
    /// Initialize the contract with the XLM token address
    pub fn initialize(env: Env, xlm_address: Address) {
        env.storage().persistent().set(&DataKey::Asset, &xlm_address);
    }

    /// Internal helper to generate a random rate for the current invocation.
    /// In Soroban, this is deterministic across all nodes for a single transaction.
    fn get_random_rate(env: &Env) -> u64 {
        // u64_in_range is inclusive of start, exclusive of end.
        // We use MAX_RATE + 1 to include the upper bound.
        env.prng().u64_in_range(MIN_RATE..MAX_RATE + 1)
    }


    /// This function is REQUIRED for the PendleWrapper to pull wXLM
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
// This allows the Wrapper to move its own wXLM to the user
    // without requiring a signature from the contract itself.
    if from != env.current_contract_address() {
        from.require_auth();
    }        let bal_from = Self::balance(env.clone(), from.clone());
        let bal_to = Self::balance(env.clone(), to.clone());

        if bal_from < amount { panic!("Insufficient wXLM balance"); }

        env.storage().persistent().set(&DataKey::Balance(from), &(bal_from - amount));
        env.storage().persistent().set(&DataKey::Balance(to), &(bal_to + amount));
    }

    



    /// Deposits XLM and grants the user virtual wXLM
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();

        let asset_addr: Address = env.storage().persistent().get(&DataKey::Asset).unwrap();
        let xlm_client = token::Client::new(&env, &asset_addr);

        // Transfer XLM from user to contract
        xlm_client.transfer(&user, &env.current_contract_address(), &amount);

        // Update balance
        let current_bal = Self::balance(env.clone(), user.clone());
env.storage().persistent().set(&DataKey::Balance(user), &(current_bal + amount));
    }

    /// Redeems wXLM for XLM using a randomized rate generated at execution time
    pub fn redeem(env: Env, user: Address, amount_wxlm: i128) {
        user.require_auth();

        // 1. Generate the random rate for THIS specific transaction
        let rate = Self::get_random_rate(&env);

        // 2. Calculate payout: (amount * rate) / 1000
        // let payout = (amount_wxlm * rate as i128) / 1000;
        let payout = amount_wxlm;

        // 3. Update internal balance (Burn wXLM)
        let current_bal = Self::balance(env.clone(), user.clone());
        if current_bal < amount_wxlm {
            panic!("Insufficient balance");
        }
env.storage().persistent().set(&DataKey::Balance(user.clone()), &(current_bal - amount_wxlm));
        // 4. Transfer XLM back to user
        let asset_addr: Address = env.storage().persistent().get(&DataKey::Asset).unwrap();
        let xlm_client = token::Client::new(&env, &asset_addr);
        xlm_client.transfer(&env.current_contract_address(), &user, &payout);
    }

    /// View function to see what the rate would be if you called it right now
    pub fn view_rate(env: Env) -> u64 {
        Self::get_random_rate(&env)
    }

    /// Returns the current balance for the user
pub fn balance(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(user)).unwrap_or(0)
    }

    // --- Metadata ---

    pub fn name(env: Env) -> String {
        String::from_str(&env, "Wrapped Yield XLM")
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, "wXLM")
    }

    pub fn decimals(_env: Env) -> u32 {
        7 
    }
}