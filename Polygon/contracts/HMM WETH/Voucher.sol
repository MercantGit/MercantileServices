// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

interface IHmmVoucher {
    function count() external view returns(uint256);
}

/*
 * @title Voucher contract
 * @notice This contract will represent buyers'option via a ERC721 token.
 */
contract Voucher is ERC721Enumerable {

    address private _hmm;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _hmm = msg.sender;
    }

    function hmm() public view virtual returns (address) {
        return _hmm;
    }

    modifier onlyHmm() {
        require(hmm() == _msgSender(), "Only HMM");
        _;
    }

    function mint(address _to, uint256 _id) external onlyHmm {
        _safeMint(_to, _id);
    }

    function burn(uint256 tokenId) external onlyHmm {
        _burn(tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "";
    }
    
}