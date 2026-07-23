import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface ScanFeedEvent {
  transactionId: string;
  workerName: string;
  clockNumber: string;
  department: string;
  shift: string;
  couponType: string;
  businessDate: string;
  time: string;
  status: 'SUCCESS' | 'REJECTED';
  remaining: { breakfastTea: number; meal: number; tea: number };
  photoUrl: string | null;
}

/**
 * Namespace /dashboard broadcasts every scan attempt to connected canteen
 * and admin dashboards in real time. In multi-replica deployments, wire the
 * Redis adapter (@socket.io/redis-adapter) onto this gateway's server in
 * main.ts so events fan out across all backend pods.
 */
@WebSocketGateway({ namespace: '/dashboard', cors: { origin: '*' } })
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DashboardGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Dashboard client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Dashboard client disconnected: ${client.id}`);
  }

  broadcastScan(event: ScanFeedEvent) {
    this.server.emit('scan:new', event);
  }
}
