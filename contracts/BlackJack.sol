// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract FunctionsConsumerExample is FunctionsClient, ConfirmedOwner, ERC721URIStorage {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    mapping(bytes32 reqId => address player) s_reqIdToPlayer;
    uint256 s_tokenId = 0;

    uint8 private s_donHostedSecretsSlotID;
    uint64 private s_donHostedSecretsVersion;
    uint64 private s_subscriptionId;

    string constant SOURCE = 'if(!secrets.apiKey)throw Error("API key should be provided!");const a=args[0],r=await Functions.makeHttpRequest({url:"https://chmju276v4yb2fifeishsukrpu0zyabg.lambda-url.us-east-1.on.aws/",method:"GET",headers:{player:a,"api-key":secrets.apiKey}});if(r.error)throw Error("Request failed");const{data:d}=r;if(!d.score)throw Error("score does not exist");return Functions.encodeInt256(d.score)';
    uint32 constant GAS_LIMIT = 300_000;
    bytes32 constant DON_ID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    string constant META_DATA = "ipfs://QmeRwhSvWgxAKgj7Eu1nxMkfhRDkDT7a98dRY4T5X1XwXp";
    address constant ROUTER_ID = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;

    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    constructor() FunctionsClient(ROUTER_ID) ConfirmedOwner(msg.sender) ERC721("BlackJack", "BJK") {}

    function setDonHostSecretConfig(uint8 _slotId, uint64 _version, uint64 _subId) public onlyOwner {
        s_donHostedSecretsSlotID = _slotId;
        s_donHostedSecretsVersion = _version;
        s_subscriptionId = _subId;
    }

    function sendRequest(
        string[] memory args,
        address player
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);

        req.addDONHostedSecrets(
            s_donHostedSecretsSlotID,
            s_donHostedSecretsVersion
        );

        if (args.length > 0) req.setArgs(args);
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            s_subscriptionId,
            GAS_LIMIT,
            DON_ID
        );

        s_reqIdToPlayer[s_lastRequestId] = player;
        return s_lastRequestId;
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;

        // check if the player's score is greater than 1000
        int256 score = abi.decode(response, (int256));
        if (score >= 1000) {
            // mint a token for player
            address player = s_reqIdToPlayer[requestId];
            _safeMint(player, s_tokenId);
            _setTokenURI(s_tokenId, META_DATA);
            s_tokenId++;
        }

        emit Response(requestId, s_lastResponse, s_lastError);
    }
}
