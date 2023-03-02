declare module "@socket.io/sticky" {
  import http from "http";
  import socket from "socket.io";
  function setupWorker(server: socket.Server): void;
  function setupMaster(
    server: http.Server,
    opts?: {
      loadBalancingMethod: string;
    }
  ): void;
}
