const express = require("express");
const fs = require("fs");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const cors = require("cors");
const debug = require("debug")("wallet-whitelist-api");
require('dotenv').config()

const whitelistAddresses = JSON.parse(fs
  .readFileSync(process.env.WHITELIST_JSON)
  .toString());

function generateRoot() {
  const leaves = whitelistAddresses.map((addr) => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256);
  const root = tree.getRoot().toString("hex");
  return [root, tree];
}

function generateProof(_address) {
  const [root, tree] = generateRoot();
  const leaf = keccak256(_address);
  const proof = tree.getHexProof(leaf);
  return proof;
}

function onWhitelist(_address) {
  const found = whitelistAddresses.find((addr) => addr == _address);
  return found;
}

const app = express();

const server_url = `http://localhost:${process.env.PORT}`;

app.use(
  cors({
    origin: [server_url, server_url + "/*"]
  })
);

app.get("/proof/:address", (req, res) => {
  try {
    const addr = req.params.address;
    debug(`getting merkleproof for address: ${addr}`);
    const proof = generateProof(addr);
    res.status(200).json({proof});
  } 
  catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/exists/:address", (req, res) => {
  try {
    const addr = req.params.address;
    debug(`checking whitelisted address: ${addr}`);
    const whitelisted = onWhitelist(addr);
    debug({whitelisted});
    res.status(200).json({ whitelisted: !!whitelisted });
    of
  } 
  catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/root", (req, res) => {
  try {
    const [root ] = generateRoot();
    res.status(200).json({ root });
  } 
  catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  debug(`Running on port ${process.env.PORT}.`);
});

module.exports = app;
