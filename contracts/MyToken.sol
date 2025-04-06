//Token : smart contract based (native와 다르지만, 비슷하게 움직일 수 있다.)
//BTC,ETH, XRP, KAIA : native token 만약 비트코인 네트워크에서 트렌젝션을
// 만들어서 그 트렌젝션을 처리하기위한 수수료를 내야하고 그걸 비트코인으로만 받아준다.

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    string public name;
    string public symbol;
    uint8 public decimals; //1 wei --> 1*10^-18 ETH uint8 -->8 bit unsigned int

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
    //public으로 필드를 만들면 기본적으로 getter가 만들어진다.
    // function totalSupply() external view returns (uint256) {
    //     return totalSupply;
    // }
    // function name() external view returns (string){
    //     return name;
    // }
}
