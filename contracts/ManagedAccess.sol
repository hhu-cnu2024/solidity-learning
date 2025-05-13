// Centralization vs Decentraliazation
// a single DB    vs Distributed Ledger DB
// a single BN    vs BN network
// Governance : 관리, 통치
// governance --> voting
// A agenda   --> by vote --> decition

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public manager;
    address public owner;

    constructor(address _owner, address _manager) {
        owner = _owner;
        manager = _manager;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }
    modifier onlyManager() {
        require(
            msg.sender == manager,
            "You are not authorized to manage this contract" // 일반적 메세지(가스비)
        );
        _;
    }
}
