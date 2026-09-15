{ pkgs ? import <nixpkgs> {} }:

(pkgs.buildFHSEnv {
  name = "stickybot-dev";
  targetPkgs = pkgs: with pkgs; [
    nodejs_26
    python3
    gcc
    gnumake
    sqlite
    pkg-config
  ];
  runScript = "bash";
}).env
