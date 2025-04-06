//test파일은 이름을 다 맞추더라
import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
  let myTokenContract: MyToken;
  let signers: HardhatEthersSigner[];
  before("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenContract = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      18,
    ]);
  });
  it("should return name", async () => {
    expect(await myTokenContract.name()).equal("MyToken");
  });
  it("should return symbol", async () => {
    expect(await myTokenContract.symbol()).equal("MT");
  });
  it("should return decimals", async () => {
    expect(await myTokenContract.decimals()).equal(18);
  });
  it("should return 0 totalSupply", async () => {
    expect(await myTokenContract.totalSupply()).equal(1n * 10n ** 18n);
  });
  it("should return 1MT balance for signer 1", async () => {
    expect(await myTokenContract.balanceOf(signers[1].address)).equal(
      1n * 10n ** 18n
    );
  });
});
