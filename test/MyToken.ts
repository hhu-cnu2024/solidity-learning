//test파일은 이름을 다 맞추더라
//TDD : Test Driven Development : 테스트를 먼저짜고 테스트에 맞게 개발한다
import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("mytoken deploy", () => {
  let myTokenContract: MyToken;
  let signers: HardhatEthersSigner[];
  //before : 컨트랙트를 미리 실행시키고 기다려줘
  //beforeEach : 각 단위를 하기 전 마다 계속 실행시켜줘
  //종속성이 필요한 코드들끼리 단위를 만든다 describe를 이용해서 서브 그룹들을 만들면된다.
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenContract = await hre.ethers.deployContract("MyToken", [
      //deployContract할때, (컨트렉트 배포할때), hardhat ethers는 기본적으로 signer0을 선택한다. (signerfield에서 바꿀 수 있다)
      //그리고 transaction은 반드시 서명이 필요하다, 이때, ethers와 다르게 hardhat ethers는 연결된 signer0으로 내부에서 서명하고,
      //트렌젝션 전송하고, 영수증까지 처리한다.(디버깅할때 필요할 수도..)

      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
  });
  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenContract.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
      expect(await myTokenContract.symbol()).equal("MT");
    });
    it("should return DECIMALS", async () => {
      expect(await myTokenContract.decimals()).equal(DECIMALS);
    });
    //refactoring
    it("should return 100 totalSupply", async () => {
      expect(await myTokenContract.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });
  });

  describe("Mint", () => {
    it("should return 100MT balance for signer 0", async () => {
      //왜 signer0이 발행자가 되는거지? hardhat 기본설정
      expect(await myTokenContract.balanceOf(signers[0].address)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });
    //TDD :i hacker가 mint를 시도하면 안되도록 test를 먼저 짜고 거기에 맞춰서 개발해보자
    it("should return or revert when minting infinitly", async () => {
      const hacker = signers[2];
      const mintingAgainAmount = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        myTokenContract.connect(hacker).mint(mintingAgainAmount, hacker.address)
      ).to.be.revertedWith("You are not authorized to manage this token");
    });
  });
  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
      const signer1 = signers[1];
      const signer0 = signers[0];
      await expect(
        myTokenContract.transfer(
          //transfer 함수는 트렌젝션이 일어난다. (state를 건들기 때문에) myTokenContract에 signerfield가 존재하므로 알아서 서명되고,
          //트렌젝션전송되고, 영수증처리된다.-->수수료 낸다(state수정이 젤 비싸다(모든 노드가 다 해야하니까))
          hre.ethers.parseUnits("0.5", DECIMALS),
          signer1.address
        )
      )
        .to.emit(myTokenContract, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", DECIMALS)
        );

      //sol 파일은 contract인거고, test파일은 웹 어플리케이션같은 존재다. ts파일에서 네트워크랑 contract로 통신한다고 생각하면될듯

      //근데 여기서 balanceOf같은 view(getter)함수는 트렌젝션을 만들지는 않고 그냥 네트워크 노드에 연결해서 api호출로 가져온다.
      //여러개의 노드에 접속해서 전부 같은지 확인해봐야지 무결성을 검증할 수 있는 신뢰도 높은 프로그램이 된다.

      expect(await myTokenContract.balanceOf(signer1.address)).equal(
        hre.ethers.parseUnits("0.5", DECIMALS)
      );
      /*const filter = myTokenContract.filters.Transfer(signer0.address);
      const logs = await myTokenContract.queryFilter(filter, 0, "latest");
      console.log(logs.length);*/ //어플리케이션에서 보통이렇게 한다
      //단위테스트에서는?
    });

    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenContract.transfer(
          hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS), //await가 결과를 기다림 뭔진 잘 모르겠지만 예외처리를 위해서 await을 expect 앞에 해줌
          //await을 expect앞에 쓰면, expect안에가 실행되는동안 발생하는 event에 대해서 처리를 할 수 있다.
          //hre.ethers.parseUnits("99.6", DECIMALS),
          signer1.address
        )
      ).to.be.revertedWith("insufficient balance");
    });
  });
  describe("TransferFrom", () => {
    it("should emit Approval event", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenContract.approve(
          signer1.address,
          hre.ethers.parseUnits("10", DECIMALS)
        )
      )
        .to.emit(myTokenContract, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
      //console.log(await myTokenContract.balanceOf(signers[0]));
      //console.log(await myTokenContract.balanceOf(signers[1]));
    });

    it("should be reverted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenContract
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("10", DECIMALS)
          )
      ).to.be.revertedWith("insufficient allowance");
      //console.log(await myTokenContract.balanceOf(signers[0]));
      //console.log(await myTokenContract.balanceOf(signers[1]));
    });
  });
  describe("approve and transferFrom", () => {
    it("should emit Approval and transferFrom event", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenContract.approve(
          signer1.address,
          hre.ethers.parseUnits("10", DECIMALS)
        )
      )
        .to.emit(myTokenContract, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));

      await expect(
        myTokenContract
          .connect(signer1)
          .transferFrom(signer0, signer1, hre.ethers.parseUnits("1", DECIMALS))
      )
        .to.emit(myTokenContract, "Transfer")
        .withArgs(signer0, signer1, hre.ethers.parseUnits("1", DECIMALS));

      console.log(await myTokenContract.balanceOf(signers[0]));
      console.log(await myTokenContract.balanceOf(signers[1]));
    });
  });
});
//mytoken이라는 token 만듬, 이름 심볼 데시말 스테이트먼트, + 벨런스, 트렌스퍼,  발행, 전송
/*6주차-1 토큰 발행을 해봤고, 테스트에서 예외처리를 하기 위해서 await의 위치 바꿈. 코드 리팩토링(테스트할때 마다 메세지 수정을 해야한다 이걸 좀 효율적으로)
궁금증은 왜 beforeEach안하고 마지막 2개 describe로 안묶으면오류나지..?
6주차 -2 : event의 유용성, storage에 모든걸 저장하는건 힘들다
*/
