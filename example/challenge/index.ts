import { expect } from "chai";
import { ethers } from "hardhat";
import { MockCtfChallenge } from "../typechain";


// This "Challenge Setup" block must be left as-is
describe("Challenge Setup", function () {
  it("Should deploy MockCtfChallenge", async function () {
    const MockCtfChallengeFactory = await ethers.getContractFactory("MockCtfChallenge");
    const mockCtfChallenge = await MockCtfChallengeFactory.deploy()
    await mockCtfChallenge.deployed()
  });
});

// Try to solve the challenge below this line
// Run `npx hardhat ctf-try` to test your solution locally
// Run `npx hardhat ctf-try --submit` to submit your solution to the remote CTF node and get the real flag
describe("Solve Challenge", function () {
  it("Should return the winning flag", async function () {
    const mockCtfChallenge: MockCtfChallenge = await ethers.getContractAt("MockCtfChallenge", "0x5fbdb2315678afecb367f032d93f642f64180aa3");

    // Change this to 42 and run `npx hardhat ctf-try`
    const returnedFlag = await mockCtfChallenge.getFlag(41)

    console.log(`\tThe returned flag is: "${returnedFlag}"`)

    expect(returnedFlag).to.not.be.equal('try harder')
  });
});
