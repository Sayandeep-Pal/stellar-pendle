#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, IntoVal, Symbol, Val, Vec, vec
};

#[contracttype]
#[derive(Clone)]
pub enum MarketDataKey {
    PendleToken,
    XlmToken,
    SellOrderPT(Address),
    SellOrderYT(Address),
    // --- NEW: Lists to track who is selling ---
    SellersListPT,
    SellersListYT,
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    pub fn initialize(env: Env, pendle_address: Address, xlm_address: Address) {
        env.storage().instance().set(&MarketDataKey::PendleToken, &pendle_address);
        env.storage().instance().set(&MarketDataKey::XlmToken, &xlm_address);
        
        // Initialize empty lists
        let empty_vec: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&MarketDataKey::SellersListPT, &empty_vec);
        env.storage().instance().set(&MarketDataKey::SellersListYT, &empty_vec);
    }

    // --- SELLER: LISTING ---

    pub fn list_pt(env: Env, seller: Address, amount: i128) {
        seller.require_auth();
        let pendle_addr: Address = env.storage().instance().get(&MarketDataKey::PendleToken).unwrap();
        
        // 1. Transfer PT to Contract
        let args: Vec<Val> = vec![&env, seller.into_val(&env), env.current_contract_address().into_val(&env), amount.into_val(&env)];
        env.invoke_contract::<Val>(&pendle_addr, &Symbol::new(&env, "transfer_pt"), args);

        // 2. Update Balance
        let current_bal = Self::get_pt_listing(env.clone(), seller.clone());
        env.storage().persistent().set(&MarketDataKey::SellOrderPT(seller.clone()), &(current_bal + amount));

        // 3. Add to Sellers List (If not already there)
        let mut list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListPT).unwrap();
        if !list.contains(seller.clone()) {
            list.push_back(seller);
            env.storage().instance().set(&MarketDataKey::SellersListPT, &list);
        }
    }

    // --- BUYER: MARKET BUY (AUTO-MATCH) ---

    /// Buys `amount_needed` of PT from ANY available sellers automatically.
    pub fn buy_market_pt(env: Env, buyer: Address, mut amount_needed: i128) {
        buyer.require_auth();
        
        // Load the list of sellers
        let mut list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListPT).unwrap();
        let pendle_addr: Address = env.storage().instance().get(&MarketDataKey::PendleToken).unwrap();
        let xlm_addr: Address = env.storage().instance().get(&MarketDataKey::XlmToken).unwrap();
        let contract_address = env.current_contract_address();

        // Loop through sellers to fill the order
        // Note: Iterating in storage is expensive. In production, limit loop size.
        let mut i = 0;
        while i < list.len() && amount_needed > 0 {
            let seller = list.get(i).unwrap();
            let available = Self::get_pt_listing(env.clone(), seller.clone());

            if available > 0 {
                // Determine how much to take from THIS seller
                let take_amount = if available >= amount_needed { amount_needed } else { available };
                
                // 1. Calculate Cost (0.95 XLM)
                let cost = (take_amount * 95) / 100;

                // 2. Transfer XLM: Buyer -> Seller
                token::Client::new(&env, &xlm_addr).transfer(&buyer, &seller, &cost);

                // 3. Transfer PT: Contract -> Buyer
                let args: Vec<Val> = vec![&env, contract_address.into_val(&env), buyer.into_val(&env), take_amount.into_val(&env)];
                env.invoke_contract::<Val>(&pendle_addr, &Symbol::new(&env, "transfer_pt"), args);

                // 4. Update Seller's listing
                env.storage().persistent().set(&MarketDataKey::SellOrderPT(seller.clone()), &(available - take_amount));

                // 5. Update amount still needed
                amount_needed -= take_amount;
            }
            
            // If this seller is empty now, we could remove them, but for simplicity/safety we just skip
            i += 1;
        }

        if amount_needed > 0 {
            panic!("Not enough PT available for sale in the entire market!");
        }
    }

    // --- VIEW FUNCTIONS ---


    // --- SELLER: LIST YT ---
    pub fn list_yt(env: Env, seller: Address, amount: i128) {
        seller.require_auth();
        let pendle_addr: Address = env.storage().instance().get(&MarketDataKey::PendleToken).unwrap();
        
        // 1. Transfer YT to Contract (using "transfer_yt")
        let args: Vec<Val> = vec![&env, seller.into_val(&env), env.current_contract_address().into_val(&env), amount.into_val(&env)];
        env.invoke_contract::<Val>(&pendle_addr, &Symbol::new(&env, "transfer_yt"), args);

        // 2. Update Balance
        let current_bal = Self::get_yt_listing(env.clone(), seller.clone());
        env.storage().persistent().set(&MarketDataKey::SellOrderYT(seller.clone()), &(current_bal + amount));

        // 3. Add to Sellers List
        let mut list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListYT).unwrap();
        if !list.contains(seller.clone()) {
            list.push_back(seller);
            env.storage().instance().set(&MarketDataKey::SellersListYT, &list);
        }
    }


    // --- BUYER: MARKET BUY YT (AUTO-MATCH) ---
    /// Buys `amount_needed` of YT from ANY available sellers automatically.
    /// Price: 0.05 XLM per YT
    pub fn buy_market_yt(env: Env, buyer: Address, mut amount_needed: i128) {
        buyer.require_auth();
        
        // Load YT Sellers List
        let mut list: Vec<Address> = env.storage().instance().get(&MarketDataKey::SellersListYT).unwrap();
        let pendle_addr: Address = env.storage().instance().get(&MarketDataKey::PendleToken).unwrap();
        let xlm_addr: Address = env.storage().instance().get(&MarketDataKey::XlmToken).unwrap();
        let contract_address = env.current_contract_address();

        let mut i = 0;
        while i < list.len() && amount_needed > 0 {
            let seller = list.get(i).unwrap();
            let available = Self::get_yt_listing(env.clone(), seller.clone());

            if available > 0 {
                let take_amount = if available >= amount_needed { amount_needed } else { available };
                
                // COST: 0.05 * amount
                // Formula: (Amount * 5) / 100
                let cost = (take_amount * 5) / 100;

                // Transfer XLM: Buyer -> Seller
                token::Client::new(&env, &xlm_addr).transfer(&buyer, &seller, &cost);

                // Transfer YT: Contract -> Buyer (using "transfer_yt")
                let args: Vec<Val> = vec![&env, contract_address.into_val(&env), buyer.into_val(&env), take_amount.into_val(&env)];
                env.invoke_contract::<Val>(&pendle_addr, &Symbol::new(&env, "transfer_yt"), args);

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


    pub fn get_pt_listing(env: Env, seller: Address) -> i128 {
        env.storage().persistent().get(&MarketDataKey::SellOrderPT(seller)).unwrap_or(0)
    }

    pub fn get_yt_listing(env: Env, seller: Address) -> i128 {
        env.storage().persistent().get(&MarketDataKey::SellOrderYT(seller)).unwrap_or(0)
    }
}