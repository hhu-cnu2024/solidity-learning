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
  let managers: HardhatEthersSigner[];
  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    managers = [signers[1], signers[2], signers[3], signers[4], signers[5]];
    //아마도 msg.sender는 myTokenC이라는 스마트 컨트렉트같다..this같은 느낌인건가?
    myTokenC = await hre.ethers.deployContract("MyToken", [
      //생성자 파라미터

      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
      managers,
      managers.length,
    ]);
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      managers,
      managers.length,
    ]);
    await myTokenC.setManager(tinyBankC.getAddress());
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
      await expect(tinyBankC.stake(stakingAmount))
        .to.emit(tinyBankC, "Staked")
        .withArgs(signer0.address, stakingAmount);
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
      await expect(tinyBankC.withdraw(stakingAmount))
        .to.emit(tinyBankC, "Withdraw")
        .withArgs(stakingAmount, signer0.address);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
      expect(await myTokenC.balanceOf(signer0)).equal(
        hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS)
      );
    });
  });
  describe("MultiManager", async () => {
    it("should set RewardPerBlock", async () => {
      for (var i = 0; i < managers.length; i++) {
        await tinyBankC.connect(managers[i]).confirm();
        //signer0이 signer0에게 주는 코드 즉 변화가 없다
      }
      await expect(
        tinyBankC.setRewardPerBlock(hre.ethers.parseUnits("15", DECIMALS))
      )
        .to.emit(tinyBankC, "SetRewardPerBlock")
        .withArgs(hre.ethers.parseUnits("15", DECIMALS));
    });
    it("should revert when confirm by hacker", async () => {
      const hacker = signers[10];
      await expect(tinyBankC.connect(hacker).confirm()).to.be.revertedWith(
        "You are not a manager"
      );
    });
    it("should revert with not all confirm", async () => {
      for (var i = 0; i < managers.length - 2; i++) {
        await tinyBankC.connect(managers[i]).confirm();
        //signer0이 signer0에게 주는 코드 즉 변화가 없다
      }
      await expect(
        tinyBankC.setRewardPerBlock(hre.ethers.parseUnits("15", DECIMALS))
      ).to.be.revertedWith("Not all confirmed yet");
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
    it("Should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[3];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      //이벤트나 revert같은것을 트리거할때는 await을 앞에
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("Not all confirmed yet");
    });
  });
});
//beforeEach로 it마다 contract를 deploy해주기
