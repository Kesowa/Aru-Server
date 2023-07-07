# Welcome to Arya!

This folder contain the server codes of the Arya streaming platform.

# Development Guide

The following flow needs to be followed to prevent mishaps:
1. Create feature branch from dev
2. Merge feature branch into dev
3. Merge dev into dev-aws
4. Merge dev into master
5. Merge dev-aws into master-aws

# Setup

## Steps

- Install dependencies using `npm i`
- create a .env file and write the credintials
- run `npm run dev` to start development server.
- run `npm run start` to run the production server
- run `npm run build` to create production bundle
