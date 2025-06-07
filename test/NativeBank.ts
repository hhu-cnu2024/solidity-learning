import hre from "hardhat";
import { NativeBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { DECIMALS } from "./constant";

describe("NativeBank", () => {
  //contract deploy
  let signers: HardhatEthersSigner[]; // 리스트
  let nativeBankC: NativeBank;
  beforeEach("Deploy NativeBank contract", async () => {
    signers = await hre.ethers.getSigners(); // const를 붙이면 안된다 왤까
    nativeBankC = await hre.ethers.deployContract("NativeBank");
  });
  it("Should send native token to contract", async () => {
    const signers = await hre.ethers.getSigners();
    const staker = signers[0];
    const staker1 = signers[1];
    const nativeBankC = await hre.ethers.deployContract("NativeBank");

    const tx = {
      from: staker.address,
      to: await nativeBankC.getAddress(),
      value: hre.ethers.parseEther("1"),
    };
    const tx2 = {
      from: staker1.address,
      to: await nativeBankC.getAddress(),
      value: hre.ethers.parseEther("1"),
    };
    // 트렌젝션 구조
    const txResp = await staker.sendTransaction(tx); // v,r,s ?? 서명알아서해줌 그리고 변수에 트렌젝션 해쉬값 저장됨 msg.sender = staker
    const txResp2 = await staker1.sendTransaction(tx2);
    const txReceipt = await txResp.wait(); // 트렌젝션이 블록에 포함되었느지 기다리고, 확인되면 receipt를 반환 tx상태, 블록번호, 가스사용량등등
    const txReceipt2 = await txResp2.wait();
    console.log(
      await hre.ethers.provider.getBalance(await nativeBankC.getAddress())
    ); //노드에 rpc api로 조회하기 마치 서버가 클라이언트의 한 부분인것처럼
    console.log(
      await hre.ethers.provider.getBalance(await staker1.getAddress())
    );
    console.log(
      await hre.ethers.provider.getBalance(await staker.getAddress())
    );
    console.log(await nativeBankC.balanceOf(staker.address));
    //함수불러서 사용하기
  });
  it("Should withdraw all the tokens", async () => {
    const staker = signers[0];
    const stakingAmont = hre.ethers.parseEther("10");
    const tx = {
      from: staker.address,
      to: await nativeBankC.getAddress(),
      value: hre.ethers.parseEther("10"),
    };
    const sentTx = await staker.sendTransaction(tx);
    await sentTx.wait();
    expect(await nativeBankC.balanceOf(staker.address)).equal(stakingAmont);
    await nativeBankC.withdraw();
    expect(await nativeBankC.balanceOf(staker.address)).equal(0n);
  });

  const unitParser = (amount: string) =>
    hre.ethers.parseUnits(amount, DECIMALS); // 문자열로 들어온 수를 바꿔준다.
  const unitFormatter = (amount: bigint) =>
    hre.ethers.formatUnits(amount, DECIMALS); // bigint로 주어진수를 10**18로 바꿔준다.
  const getBalance = async (address: string) =>
    unitFormatter(await hre.ethers.provider.getBalance(address)); //노드에서 native에 대한 기본함수
  it("exploit", async () => {
    const victim1 = signers[1];
    const victim2 = signers[2];
    const hacker = signers[3];

    const exploitC = await hre.ethers.deployContract(
      "Exploit", //deploy할 contract의 이름
      [await nativeBankC.getAddress()], // 생성자 매개변수
      hacker // 배포자
    );
    const hCAddr = await exploitC.getAddress();
    const stakingAmount = unitParser("1");
    const v1Tx = {
      from: victim1.address,
      to: await nativeBankC.getAddress(),
      value: stakingAmount,
    };
    const v2Tx = {
      from: victim2.address,
      to: await nativeBankC.getAddress(),
      value: stakingAmount,
    };
    await victim1.sendTransaction(v1Tx);
    await victim2.sendTransaction(v2Tx);
    console.log(await getBalance(hCAddr));
    await exploitC.exploit({ value: stakingAmount });
    console.log(await getBalance(hCAddr));
    console.log(await nativeBankC.balanceOf(victim1.address));
  });
});
