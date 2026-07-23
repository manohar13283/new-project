import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AdminRole } from '../common/enums/role.enum';

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AdminRole, unique: true })
  name: AdminRole;
}
