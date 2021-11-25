/** TO-DO
 * 
 * Determine how to store metadata in a format that OpenSea will accept
 */


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CovidCats is ERC721, VRFConsumerBase, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    
    // NFT CONSTANTS
    Counters.Counter private _tokenSupply;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.1 ether;

    bool public saleIsActive = false;

    mapping (uint256 => string) private _tokenURIs;
    string private _baseTokenURI;
    
    event Mint(address indexed _minter, uint256 indexed _tokenID, uint256[7] random_numbers);

    // DECLARING CHAINLINK VRF FUNCTION CONSTANTS
    bytes32 internal keyHash; //Public key against which randomness is generated
    uint256 internal fee; //Fee required to fulfil a VRF request
    mapping(bytes32 => address) requestToSender;
    mapping(address => bool) isClaiming;
    IERC20 public LINK_token;
    
    constructor( address _VRFCoordinator, address _linkToken, bytes32 _keyHash)
        VRFConsumerBase(_VRFCoordinator, _linkToken)
        ERC721("CovidCats", "CovidCat")
        Ownable() {
            LINK_token = IERC20(_linkToken);
            keyHash = _keyHash;
            fee = 0.1 * 10 ** 18;
    }

    /** 
     * NFT Helper Functions
     */

    // I wonder how many JPEGs are left?
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - _tokenSupply.current();
    }

    // I wonder how many JPEGs are minted?
    function tokenSupply() public view returns (uint256) {
        return _tokenSupply.current();
    }

    // All the functions you don't really care about but need to be here
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        
        // // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        // return string(abi.encodePacked(base, tokenId.toString()));
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) external {
        require(owner() == msg.sender || ownerOf(tokenId) == msg.sender, "Only the contract owner or NFT owner can set the tokenURI");
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    // Go go go!
    function toggleSale() public onlyOwner {
        saleIsActive = !saleIsActive;
    }

    // You had to expect this function, right?
    function withdrawBalance() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    /** 
     * Requests random number from Chainlink VRF function
     */
    function claim() public payable returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        require(saleIsActive, "Minting not open yet!");
        uint256 mintIndex = _tokenSupply.current() + 1; // Start IDs at 1
        require(mintIndex <= MAX_SUPPLY, "No more CovidCats available to mint :(");
        require(isClaiming[msg.sender] == false, "YOU CANNOT CLAIM ANOTHER NFT YET");
        require(msg.value >= MINT_PRICE, "Not enough ETH to buy a CovidCat!");

        requestId = requestRandomness(keyHash, fee);
        requestToSender[requestId] = msg.sender;
        isClaiming[msg.sender] = true;
    }

    /**
     * Callback function used by VRF Coordinator
     * Using "Having multiple VRF requests in flight" pattern as per https://docs.chain.link/docs/chainlink-vrf-best-practices/
     * Also using "Getting multiple random numbers" pattern
     * Also using "Getting a random number within a range" pattern
     * NOTE that this function has a gas limit of 200,000 or it will as per Chainlink docs
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        
        // Get tokenId for this NFT mint
        uint256 id = _tokenSupply.current() + 1;

        address initiator = requestToSender[requestId];
        
        // Get 7 random numbers in the range from 1 to 100
        uint256[7] memory randomValues;
        
        for (uint256 i = 0; i < 7; i++) {
            randomValues[i] = uint256(keccak256(abi.encode(randomness, i)));
            randomValues[i] = (randomValues[i] % 100) + 1;
        }

        // Mint NFT
        _tokenSupply.increment();
        _safeMint(initiator, id);
        
        emit Mint(initiator, id, 
            [
                randomValues[0],
                randomValues[1],
                randomValues[2],
                randomValues[3],
                randomValues[4],
                randomValues[5],
                randomValues[6]
            ]
        );

        isClaiming[initiator] = false;
    }

    // Withdraw function to avoid locking your LINK in the contract
    function withdrawLink() onlyOwner external {
        uint256 LINK_balance = LINK_token.balanceOf(address(this));
        LINK_token.safeTransfer(msg.sender, LINK_balance);
    }
}
