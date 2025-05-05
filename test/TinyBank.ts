//보통 각 contract별로 그룹핑하여서 ts script를만든다.
import hre, { ignition } from "hardhat"; // hardhat runtime evironment를 불러오기
import { expect } from "chai"; //chai 프레임워크에서 expect를 가져와야 testcase를 만들수 있다
import { MINTING_AMOUNT, DECIMALS } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let myTokenC: MyToken; //모든 그룹핑에서 이 컨트랙트를 쓰기위해서
  let tinyBankC: TinyBank;
  let signers: HardhatEthersSigner[];
  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      //생성자 파라미터

      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
    ]);
  });
  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });
  describe("Staking", async () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      console.log(await myTokenC.balanceOf(signer0));
      expect(await myTokenC.balanceOf(tinyBankC)).equal(
        await tinyBankC.totalStaked()
      );
      expect(await tinyBankC.totalStaked()).equal(stakingAmount);
    });
  });
  describe("Withdraw", async () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
      expect(await myTokenC.balanceOf(signer0)).equal(
        hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS)
      );
    });
  });
  describe("reward", () => {
    it("should reward 1MT every blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
        //signer0이 signer0에게 주는 코드 즉 변화가 없다
      }
      console.log(await myTokenC.balanceOf(signer0.address));
      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString())
        //블럭개수가 늘어서 reward가 더 커졌다
      );
    });
  });
});
//beforeEach로 it마다 contract를 deploy해주기
