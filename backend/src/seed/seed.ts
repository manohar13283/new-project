import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import dataSource from '../config/typeorm.config';
import { Factory } from '../entities/factory.entity';
import { Canteen } from '../entities/canteen.entity';
import { QrCode } from '../entities/qr-code.entity';
import { Department } from '../entities/department.entity';
import { Shift } from '../entities/shift.entity';
import { ShiftMealWindow } from '../entities/shift-meal-window.entity';
import { Role } from '../entities/role.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { Worker } from '../entities/worker.entity';
import { CouponType, ShiftCode } from '../common/enums/coupon-type.enum';
import { AdminRole } from '../common/enums/role.enum';

dotenv.config();

async function seed() {
  await dataSource.initialize();

  const factory = await dataSource.getRepository(Factory).save({ name: 'Union Factory' });
  const canteen = await dataSource.getRepository(Canteen).save({ factoryId: factory.id, name: 'Main Canteen', location: 'Block A' });
  await dataSource.getRepository(QrCode).save({ canteenId: canteen.id, codeValue: 'CANTEEN-MAIN-001', active: true });

  const departments = await dataSource.getRepository(Department).save([
    { factoryId: factory.id, name: 'Assembly' },
    { factoryId: factory.id, name: 'Welding' },
    { factoryId: factory.id, name: 'Quality' },
    { factoryId: factory.id, name: 'Logistics' },
  ]);

  const shiftDefs: Array<{ code: ShiftCode; name: string; windows: Array<{ couponType: CouponType; startTime: string; endTime: string; crossesMidnight?: boolean }> }> = [
    {
      code: ShiftCode.FIRST,
      name: '1st Shift',
      windows: [
        { couponType: CouponType.BREAKFAST_TEA, startTime: '08:30', endTime: '09:30' },
        { couponType: CouponType.MEAL, startTime: '11:30', endTime: '14:00' },
        { couponType: CouponType.TEA, startTime: '14:30', endTime: '15:30' },
      ],
    },
    {
      code: ShiftCode.SECOND,
      name: '2nd Shift',
      windows: [
        { couponType: CouponType.BREAKFAST_TEA, startTime: '16:30', endTime: '17:30' },
        { couponType: CouponType.MEAL, startTime: '19:30', endTime: '21:30' },
      ],
    },
    {
      code: ShiftCode.THIRD,
      name: '3rd Shift',
      windows: [
        { couponType: CouponType.TEA, startTime: '01:30', endTime: '02:30', crossesMidnight: true },
        { couponType: CouponType.BREAKFAST_TEA, startTime: '03:30', endTime: '04:30', crossesMidnight: true },
      ],
    },
  ];

  const shifts: Shift[] = [];
  for (const def of shiftDefs) {
    const shift = await dataSource.getRepository(Shift).save({ code: def.code, name: def.name });
    await dataSource.getRepository(ShiftMealWindow).save(def.windows.map((w) => ({ ...w, shiftId: shift.id })));
    shifts.push(shift);
  }

  const roles = await dataSource.getRepository(Role).save([
    { name: AdminRole.SUPER_ADMIN },
    { name: AdminRole.ADMIN },
    { name: AdminRole.CANTEEN_STAFF },
  ]);

  await dataSource.getRepository(AdminUser).save({
    email: 'admin@myunioncanteen.example.com',
    passwordHash: await bcrypt.hash('ChangeMe123!', 10),
    roleId: roles.find((r) => r.name === AdminRole.SUPER_ADMIN)!.id,
  });

  await dataSource.getRepository(Worker).save({
    clockNumber: 'W10001',
    fullName: 'Ramesh Kumar',
    passwordHash: await bcrypt.hash('Worker@123', 10),
    departmentId: departments[0].id,
    shiftId: shifts[0].id,
    factoryId: factory.id,
    phone: '+919999999999',
    languagePref: 'en',
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete. Admin login: admin@myunioncanteen.example.com / ChangeMe123!');
  // eslint-disable-next-line no-console
  console.log('Worker login: W10001 / Worker@123');

  await dataSource.destroy();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
