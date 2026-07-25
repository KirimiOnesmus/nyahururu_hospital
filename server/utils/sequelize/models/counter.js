"use strict";

module.exports = (sequelize, DataTypes) => {
  const Counter = sequelize.define(
    "Counter",
    {
      // e.g. "NCRH-CLR-2026" — kept as the primary key, same shape as the
      // Mongoose model's custom `_id: String`.
      key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
      },
      seq: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "counters",
      timestamps: false,
    },
  );

  /**
   * Atomically increments and returns the counter for `key`, creating it
   * at 0 -> 1 if it doesn't exist yet. Uses INSERT ... ON DUPLICATE KEY
   * UPDATE (via a raw query) so the increment is a single atomic statement
   * at the database level — matching the atomicity Mongo's
   * findOneAndUpdate($inc, upsert:true) provided, and closing the
   * read-then-write race the original model's comment warned about.
   */
  Counter.incrementAndGet = async function incrementAndGet(key, options = {}) {
    const { transaction } = options;
    await sequelize.query(
      `INSERT INTO counters (\`key\`, seq)
       VALUES (:key, 1)
       ON DUPLICATE KEY UPDATE seq = seq + 1`,
      { replacements: { key }, transaction },
    );
    const counter = await Counter.findByPk(key, { transaction });
    return counter.seq;
  };

  return Counter;
};
