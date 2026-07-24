"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "researchers",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          first_name: { type: Sequelize.STRING(50), allowNull: false },
          last_name: { type: Sequelize.STRING(50), allowNull: false },
          name: { type: Sequelize.STRING(120), allowNull: true },
          email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
          phone: { type: Sequelize.STRING(30), allowNull: true, defaultValue: "" },

          password: { type: Sequelize.STRING(255), allowNull: true },

          role: {
            type: Sequelize.ENUM("researcher", "reviewer", "research_committee"),
            allowNull: false,
            defaultValue: "researcher",
          },
          status: {
            type: Sequelize.ENUM("active", "invited", "inactive", "suspended"),
            allowNull: false,
            defaultValue: "active",
          },

          email_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          email_verification_token: { type: Sequelize.STRING(255), allowNull: true },
          email_verification_expire: { type: Sequelize.DATE, allowNull: true },

          password_reset_token: { type: Sequelize.STRING(255), allowNull: true },
          password_reset_expire: { type: Sequelize.DATE, allowNull: true },

          invitation_token: { type: Sequelize.STRING(255), allowNull: true },
          invitation_expire: { type: Sequelize.DATE, allowNull: true },
          invited_by_admin_id: { type: Sequelize.STRING(50), allowNull: true },
          invited_by_admin_name: { type: Sequelize.STRING(150), allowNull: true },
          invited_at: { type: Sequelize.DATE, allowNull: true },
          invitation_accepted_at: { type: Sequelize.DATE, allowNull: true },

          title: { type: Sequelize.STRING(50), allowNull: true, defaultValue: "" },
          institution: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "" },
          department: { type: Sequelize.STRING(150), allowNull: true, defaultValue: "" },
          discipline: { type: Sequelize.STRING(150), allowNull: true, defaultValue: "" },
          qualification: { type: Sequelize.STRING(150), allowNull: true, defaultValue: "" },
          bio: { type: Sequelize.STRING(1000), allowNull: true, defaultValue: "" },
          location: { type: Sequelize.STRING(150), allowNull: true, defaultValue: "" },

          social_links: { type: Sequelize.JSON, allowNull: false },
          profile_image: { type: Sequelize.STRING(500), allowNull: true },
          profile_image_key: { type: Sequelize.STRING(255), allowNull: true },

          specialisations: { type: Sequelize.JSON, allowNull: false },
          review_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          acceptance_rate: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },

          notifications: { type: Sequelize.JSON, allowNull: false },

          is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          deactivated_at: { type: Sequelize.DATE, allowNull: true },
          last_login: { type: Sequelize.DATE, allowNull: true },
          is_committee: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          committee_since: { type: Sequelize.DATE, allowNull: true },
          promoted_from_reviewer: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          transaction,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
        },
      );

      await queryInterface.addIndex("researchers", ["role", "status"], {
        transaction,
        name: "researchers_role_status_idx",
      });
      await queryInterface.addIndex("researchers", ["role", "institution"], {
        transaction,
        name: "researchers_role_institution_idx",
      });
      await queryInterface.addIndex("researchers", ["role", "is_committee"], {
        transaction,
        name: "researchers_role_committee_idx",
      });

      // FULLTEXT index for name/email/institution/discipline search — the
      // MySQL equivalent of the Mongo weighted text index. Sequelize's
      // addIndex doesn't expose the FULLTEXT index type for MySQL, so this
      // is raw SQL, still inside the same migration transaction.
      await queryInterface.sequelize.query(
        `ALTER TABLE researchers
         ADD FULLTEXT INDEX researchers_text_search (name, email, institution, discipline)`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("researchers");
  },
};
