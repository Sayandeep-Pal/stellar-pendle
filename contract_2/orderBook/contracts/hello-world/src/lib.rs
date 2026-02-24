#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, IntoVal, Symbol, Val, Vec, vec
};

#[contracttype]
#[derive(Clone)]
pub enum MarketDataKey {
    WrapperContract, // Points to your StUsdcPendleWrapper
    UsdcToken,       // Points to the Stellar USDC asset
    SellOrderPT(Address),
    SellOrderYT(Address),
    SellersListPT,   // Tracks who is selling PT for auto-matching
    SellersListYT,   // Tracks who is selling YT for auto-matching
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    /// Initializes the marketplace with the necessary contract addresses.
    /// Call this immediately after deploying the contract.
    pub fn initialize(env: Env, wrapper_address: Address, usdc_address: Address) {
        env.storage().instance().set(&MarketDataKey::WrapperContract, &wrapper_address);
        env.storage().instance().set(&MarketDataKey::UsdcToken, &usdc_address);
        
        // Initialize empty lists for auto-matching
        let empty_vec: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&MarketDataKey::SellersListPT, &empty_vec);
        env.storage().instance().set(&MarketDataKey::SellersListYT, &empty_vec);
    }

    // ==========================================
    // --- PT (PRINCIPAL TOKEN) MARKETPLACE ---
    // ==========================================

    /// SELLER: Lists PT for sale on the market.
    pub fn list_pt(env: Env, seller: Address, amount: i128) {
        seller.require_auth();
        if amount <= 0 { panic!("Amount must be greater than 0"); }

        let wrapper_addr: Address = env.storage().instance().get(&MarketDataKey::WrapperContract).unwrap();
        
        // 1. Transfer PT to Contract Escrow
        let args: Vec<Val> = vec![&env, seller.into_val(&env), env.current_contract_address().into_val(&env), amount.into_val(&env)];
        env.invoke_contract::<Val>(&wrapper_addr, &Symbol::new(&env, "transfer_pt"), args);

        // 2. Update Seller's Balance
        let current_bal = Self::get_pt_listing(env.clone(), seller.clone());
        env.storage().persistent().set(&MarketDataKey::SellOrderPT(seller.clone()), &(current_bal + amount));

        // 3. Add to Sellers List (If not already there)
        let mut list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListPT).unwrap();
        if !list.contains(seller.clone()) {
            list.push_back(seller);
            env.storage().instance().set(&MarketDataKey::SellersListPT, &list);
        }
    }

    /// BUYER: Automatically buys `amount_needed` of PT from available sellers.
    /// Price: 0.97 USDC per PT.
    pub fn buy_market_pt(env: Env, buyer: Address, mut amount_needed: i128) {
        buyer.require_auth();
        if amount_needed <= 0 { panic!("Amount needed must be greater than 0"); }
        
        let list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListPT).unwrap();
        let wrapper_addr: Address = env.storage().instance().get(&MarketDataKey::WrapperContract).unwrap();
        let usdc_addr: Address = env.storage().instance().get(&MarketDataKey::UsdcToken).unwrap();
        let contract_address = env.current_contract_address();

        let mut i = 0;
        while i < list.len() && amount_needed > 0 {
            let seller = list.get(i).unwrap();
            let available = Self::get_pt_listing(env.clone(), seller.clone());

            if available > 0 {
                let take_amount = if available >= amount_needed { amount_needed } else { available };
                
                // COST: 0.97 USDC (Scaled by 100)
                let cost = (take_amount * 97) / 100;

                // Transfer USDC: Buyer -> Seller
                token::Client::new(&env, &usdc_addr).transfer(&buyer, &seller, &cost);

                // Transfer PT: Contract -> Buyer
                let args: Vec<Val> = vec![&env, contract_address.into_val(&env), buyer.into_val(&env), take_amount.into_val(&env)];
                env.invoke_contract::<Val>(&wrapper_addr, &Symbol::new(&env, "transfer_pt"), args);

                // Update Seller's listing
                env.storage().persistent().set(&MarketDataKey::SellOrderPT(seller.clone()), &(available - take_amount));

                amount_needed -= take_amount;
            }
            i += 1;
        }

        if amount_needed > 0 {
            panic!("Not enough PT available for sale in the entire market!");
        }
    }

    // ==========================================
    // --- YT (YIELD TOKEN) MARKETPLACE ---
    // ==========================================

    /// SELLER: Lists YT for sale on the market.
    pub fn list_yt(env: Env, seller: Address, amount: i128) {
        seller.require_auth();
        if amount <= 0 { panic!("Amount must be greater than 0"); }

        let wrapper_addr: Address = env.storage().instance().get(&MarketDataKey::WrapperContract).unwrap();
        
        // 1. Transfer YT to Contract Escrow
        let args: Vec<Val> = vec![&env, seller.into_val(&env), env.current_contract_address().into_val(&env), amount.into_val(&env)];
        env.invoke_contract::<Val>(&wrapper_addr, &Symbol::new(&env, "transfer_yt"), args);

        // 2. Update Seller's Balance
        let current_bal = Self::get_yt_listing(env.clone(), seller.clone());
        env.storage().persistent().set(&MarketDataKey::SellOrderYT(seller.clone()), &(current_bal + amount));

        // 3. Add to Sellers List (If not already there)
        let mut list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListYT).unwrap();
        if !list.contains(seller.clone()) {
            list.push_back(seller);
            env.storage().instance().set(&MarketDataKey::SellersListYT, &list);
        }
    }

    /// BUYER: Automatically buys `amount_needed` of YT from available sellers.
    /// Price: 0.03 USDC per YT.
    pub fn buy_market_yt(env: Env, buyer: Address, mut amount_needed: i128) {
        buyer.require_auth();
        if amount_needed <= 0 { panic!("Amount needed must be greater than 0"); }
        
        let list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListYT).unwrap();
        let wrapper_addr: Address = env.storage().instance().get(&MarketDataKey::WrapperContract).unwrap();
        let usdc_addr: Address = env.storage().instance().get(&MarketDataKey::UsdcToken).unwrap();
        let contract_address = env.current_contract_address();

        let mut i = 0;
        while i < list.len() && amount_needed > 0 {
            let seller = list.get(i).unwrap();
            let available = Self::get_yt_listing(env.clone(), seller.clone());

            if available > 0 {
                let take_amount = if available >= amount_needed { amount_needed } else { available };
                
                // COST: 0.03 USDC (Scaled by 100)
                let cost = (take_amount * 3) / 100;

                // Transfer USDC: Buyer -> Seller
                token::Client::new(&env, &usdc_addr).transfer(&buyer, &seller, &cost);

                // Transfer YT: Contract -> Buyer
                let args: Vec<Val> = vec![&env, contract_address.into_val(&env), buyer.into_val(&env), take_amount.into_val(&env)];
                env.invoke_contract::<Val>(&wrapper_addr, &Symbol::new(&env, "transfer_yt"), args);

                // Update Seller's listing
                env.storage().persistent().set(&MarketDataKey::SellOrderYT(seller.clone()), &(available - take_amount));

                amount_needed -= take_amount;
            }
            i += 1;
        }

        if amount_needed > 0 {
            panic!("Not enough YT available for sale in the entire market!");
        }
    }

    // ==========================================
    // --- VIEW FUNCTIONS ---
    // ==========================================

    /// Returns the amount of PT a specific user currently has listed for sale.
    pub fn get_pt_listing(env: Env, seller: Address) -> i128 {
        env.storage().persistent().get(&MarketDataKey::SellOrderPT(seller)).unwrap_or(0)
    }

    /// Returns the amount of YT a specific user currently has listed for sale.
    pub fn get_yt_listing(env: Env, seller: Address) -> i128 {
        env.storage().persistent().get(&MarketDataKey::SellOrderYT(seller)).unwrap_or(0)
    }
}