#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env,
    token::StellarAssetClient, 
};

#[contracttype]
pub enum DataKey {
    Relayer,        
    TokenAddress,   
    Processed(BytesN<32>), 
    YieldIndex,     // NEW: Added the storage key for our yield index
}

#[contract]
pub struct BridgeContract;

#[contractimpl]
impl BridgeContract {
    pub fn initialize(env: Env, relayer: Address, token_address: Address) {
        if env.storage().instance().has(&DataKey::Relayer) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Relayer, &relayer);
        env.storage().instance().set(&DataKey::TokenAddress, &token_address);
    }

    pub fn withdraw(env: Env, from: Address, amount: i128, evm_dest: BytesN<20>) {
        // 1. Require the user to authorize this burn
        from.require_auth();

        // 2. Burn the tokens
        let token_address: Address = env.storage().instance().get(&DataKey::TokenAddress).unwrap();
        let token_client = StellarAssetClient::new(&env, &token_address);
        token_client.burn(&from, &amount);

        // 3. Emit an event for the Relayer to catch
        let topics = (soroban_sdk::symbol_short!("withdraw"), from);
        env.events().publish(topics, (evm_dest, amount));
    }

    pub fn mint(env: Env, to: Address, amount: i128, evm_tx_hash: BytesN<32>) {
        // 1. Verify Relayer Authorization
        let relayer: Address = env.storage().instance().get(&DataKey::Relayer).unwrap();
        relayer.require_auth();

        // 2. Prevent Replay Attacks
        let processed_key = DataKey::Processed(evm_tx_hash.clone());
        if env.storage().persistent().has(&processed_key) {
            panic!("EVM transaction already processed");
        }
        env.storage().persistent().set(&processed_key, &true);

        // 3. Get the Token Address
        let token_address: Address = env.storage().instance().get(&DataKey::TokenAddress).unwrap();
        
        // 4. Mint the token
        let token_client = StellarAssetClient::new(&env, &token_address);
        token_client.mint(&to, &amount);
    }

    // ==========================================
    // NEW: YIELD ORACLE FUNCTIONS
    // ==========================================

    /// Catches the Yield Index pushed by your Node.js Oracle Relayer
    pub fn update_yield_index(env: Env, index: i128) {
        // SECURITY FIRST: We MUST require auth from the Relayer! 
        // If we don't have this, any random user could call this function, 
        // fake a 1,000,000% yield, and drain the entire vault.
        let relayer: Address = env.storage().instance().get(&DataKey::Relayer).unwrap();
        relayer.require_auth();

        // Save the new index to the contract's instance storage
        env.storage().instance().set(&DataKey::YieldIndex, &index);

        // Extend the Time-To-Live (TTL) so the network doesn't archive the data
        env.storage().instance().extend_ttl(100_000, 100_000);
    }

    /// Reads the current yield index so your Frontend UI or other functions can use it
    pub fn get_yield_index(env: Env) -> i128 {
        // If the Oracle hasn't pushed anything yet, we default to 10_000_000.
        // Because Soroban uses 7 decimals, 10_000_000 is exactly equal to 1.0000000!
        env.storage().instance().get(&DataKey::YieldIndex).unwrap_or(10_000_000)
    }
}