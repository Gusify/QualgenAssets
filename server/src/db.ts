import { DataTypes, Sequelize } from 'sequelize';

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME = 'asset_tracker',
  DB_USER = 'root',
  DB_PASS = ''
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: false
});

async function migrateAssetsLocationColumn() {
  const queryInterface = sequelize.getQueryInterface();

  let assetsTable: Record<string, unknown>;
  try {
    assetsTable = (await queryInterface.describeTable('assets')) as Record<string, unknown>;
  } catch {
    return;
  }

  const hasLegacyLocationColumn = Object.prototype.hasOwnProperty.call(assetsTable, 'location');
  const hasLocationIdColumn = Object.prototype.hasOwnProperty.call(assetsTable, 'locationId');

  if (!hasLegacyLocationColumn && hasLocationIdColumn) {
    return;
  }

  if (!hasLegacyLocationColumn && !hasLocationIdColumn) {
    return;
  }

  if (!hasLocationIdColumn) {
    await queryInterface.addColumn('assets', 'locationId', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    });
  }

  try {
    await queryInterface.describeTable('locations');
  } catch {
    await queryInterface.createTable('locations', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  }

  if (hasLegacyLocationColumn) {
    await sequelize.query(
      "INSERT IGNORE INTO locations (name, createdAt, updatedAt)\n" +
        "SELECT DISTINCT TRIM(location), NOW(), NOW()\n" +
        "FROM assets\n" +
        "WHERE location IS NOT NULL AND TRIM(location) <> ''"
    );

    await sequelize.query(
      "INSERT IGNORE INTO locations (name, createdAt, updatedAt) VALUES ('Unknown', NOW(), NOW())"
    );

    await sequelize.query(
      "UPDATE assets SET location='Unknown' WHERE location IS NULL OR TRIM(location) = ''"
    );

    await sequelize.query(
      'UPDATE assets a\n' +
        'JOIN locations l ON TRIM(a.location) = l.name\n' +
        'SET a.locationId = l.id\n' +
        'WHERE a.locationId IS NULL'
    );
  }

  await sequelize.query(
    "UPDATE assets SET locationId = (SELECT id FROM locations WHERE name='Unknown' LIMIT 1)\n" +
      'WHERE locationId IS NULL'
  );

  await queryInterface.changeColumn('assets', 'locationId', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  });

  try {
    await queryInterface.addConstraint('assets', {
      fields: ['locationId'],
      type: 'foreign key',
      name: 'fk_assets_locationId_locations_id',
      references: {
        table: 'locations',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  } catch {
    // Constraint likely already exists; ignore.
  }

  if (hasLegacyLocationColumn) {
    try {
      await queryInterface.removeColumn('assets', 'location');
    } catch {
      // Column may have already been removed; ignore.
    }
  }
}

async function migrateAssetsExpressServiceTagColumn() {
  const queryInterface = sequelize.getQueryInterface();

  let assetsTable: Record<string, unknown>;
  try {
    assetsTable = (await queryInterface.describeTable('assets')) as Record<string, unknown>;
  } catch {
    return;
  }

  const hasExpressServiceTagColumn = Object.keys(assetsTable).some(
    column => column.toLowerCase() === 'expressservicetag'
  );

  if (hasExpressServiceTagColumn) {
    return;
  }

  await queryInterface.addColumn('assets', 'expressServiceTag', {
    type: DataTypes.STRING(64),
    allowNull: true
  });
}

async function migrateAssetsOwnerColumn() {
  const queryInterface = sequelize.getQueryInterface();

  let assetsTable: Record<string, unknown>;
  try {
    assetsTable = (await queryInterface.describeTable('assets')) as Record<string, unknown>;
  } catch {
    return;
  }

  const hasLegacyOwnerColumn = Object.prototype.hasOwnProperty.call(assetsTable, 'owner');
  const hasOwnerIdColumn = Object.prototype.hasOwnProperty.call(assetsTable, 'ownerId');

  if (!hasLegacyOwnerColumn && hasOwnerIdColumn) {
    return;
  }

  if (!hasLegacyOwnerColumn && !hasOwnerIdColumn) {
    return;
  }

  if (!hasOwnerIdColumn) {
    await queryInterface.addColumn('assets', 'ownerId', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    });
  }

  try {
    await queryInterface.describeTable('owners');
  } catch {
    await queryInterface.createTable('owners', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  }

  if (hasLegacyOwnerColumn) {
    await sequelize.query(
      "INSERT IGNORE INTO owners (name, createdAt, updatedAt)\n" +
        "SELECT DISTINCT TRIM(owner), NOW(), NOW()\n" +
        "FROM assets\n" +
        "WHERE owner IS NOT NULL AND TRIM(owner) <> ''"
    );

    await sequelize.query(
      "INSERT IGNORE INTO owners (name, createdAt, updatedAt) VALUES ('Unknown', NOW(), NOW())"
    );

    await sequelize.query("UPDATE assets SET owner='Unknown' WHERE owner IS NULL OR TRIM(owner) = ''");

    await sequelize.query(
      'UPDATE assets a\n' +
        'JOIN owners o ON TRIM(a.owner) = o.name\n' +
        'SET a.ownerId = o.id\n' +
        'WHERE a.ownerId IS NULL'
    );
  }

  await sequelize.query(
    "UPDATE assets SET ownerId = (SELECT id FROM owners WHERE name='Unknown' LIMIT 1)\n" +
      'WHERE ownerId IS NULL'
  );

  await queryInterface.changeColumn('assets', 'ownerId', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  });

  try {
    await queryInterface.addConstraint('assets', {
      fields: ['ownerId'],
      type: 'foreign key',
      name: 'fk_assets_ownerId_owners_id',
      references: {
        table: 'owners',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  } catch {
    // Constraint likely already exists; ignore.
  }

  if (hasLegacyOwnerColumn) {
    try {
      await queryInterface.removeColumn('assets', 'owner');
    } catch {
      // Column may have already been removed; ignore.
    }
  }
}

async function migrateAssetModelTables() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    await queryInterface.describeTable('assetTypes');
  } catch {
    await queryInterface.createTable('assetTypes', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  }

  try {
    await queryInterface.describeTable('brands');
  } catch {
    await queryInterface.createTable('brands', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  }

  try {
    await queryInterface.describeTable('assetModels');
  } catch {
    await queryInterface.createTable('assetModels', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      assetTypeId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'assetTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      brandId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'brands',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      specSummary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  }

  try {
    await queryInterface.describeTable('assetSpecs');
  } catch {
    await queryInterface.createTable('assetSpecs', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      assetModelId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'assetModels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      value: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  }

  const baseAssetTypes = [
    'Laptop',
    'Desktop',
    'Tablet',
    'Monitor',
    'Headset',
    'Accessory',
    'Server',
    'Networking',
    'Printer',
    'Unknown'
  ];
  const baseBrands = ['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Logitech', 'Samsung', 'Unknown'];

  const escapeValue = (value: string) => value.replace(/'/g, "''");

  if (baseAssetTypes.length) {
    const values = baseAssetTypes
      .map(type => `('${escapeValue(type)}', NULL, NOW(), NOW())`)
      .join(', ');
    await sequelize.query(
      `INSERT IGNORE INTO assetTypes (name, description, createdAt, updatedAt) VALUES ${values}`
    );
  }

  if (baseBrands.length) {
    const values = baseBrands.map(brand => `('${escapeValue(brand)}', NOW(), NOW())`).join(', ');
    await sequelize.query(`INSERT IGNORE INTO brands (name, createdAt, updatedAt) VALUES ${values}`);
  }

  let assetsTable: Record<string, unknown>;
  try {
    assetsTable = (await queryInterface.describeTable('assets')) as Record<string, unknown>;
  } catch {
    return;
  }

  const hasAssetModelIdColumn = Object.keys(assetsTable).some(
    column => column.toLowerCase() === 'assetmodelid'
  );

  if (!hasAssetModelIdColumn) {
    await queryInterface.addColumn('assets', 'assetModelId', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    });
  }

  try {
    await queryInterface.addConstraint('assets', {
      fields: ['assetModelId'],
      type: 'foreign key',
      name: 'fk_assets_assetModelId_assetModels_id',
      references: {
        table: 'assetModels',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  } catch {
    // Constraint likely already exists; ignore.
  }
}

export async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  await migrateAssetsLocationColumn();
  await migrateAssetsExpressServiceTagColumn();
  await migrateAssetsOwnerColumn();
  await migrateAssetModelTables();
}
