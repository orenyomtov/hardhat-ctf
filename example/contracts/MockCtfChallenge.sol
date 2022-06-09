//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract MockCtfChallenge {
    function getFlag(uint answer) public pure returns (string memory) {
        if (answer == 42) {
            return "CTF{mock_flag}";
        }
        
        return "try harder";
    }
}
