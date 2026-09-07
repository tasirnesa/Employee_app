-- PostgreSQL transactional-data reset for coop_erp.
--
-- Preserves security, organisation, accounting/material/asset master data,
-- configuration, and workflow definitions.  It clears every other public
-- table, including GRN, goods issue, purchasing, stock, AP/AR, journals,
-- budgets, and fixed-asset transaction data.
--
-- IMPORTANT
-- 1. Take a verified backup first.
-- 2. Run against the intended database only (preferably a test database).
-- 3. Review the allow-list below before running.  The operation is atomic:
--    it can be cancelled with ROLLBACK before COMMIT.

BEGIN;

DO $reset$
DECLARE
    preserved_tables text[] := ARRAY[
        -- Users, roles, permissions, and organisation
        'role', 'app_user', 'employee', 'company', 'branch_teams',
        'resource_node', 'operation', 'resource_operation',
        'role_operation_permission', 'user_role', 'user_operation_override',
        'user_cost_center', 'user_plant', 'user_parameter', 'user_favorite',

        -- General configuration and finance masters
        'account', 'account_group', 'account_type',
        'account_category_reference', 'account_determination',
        'automatic_account_determination', 'company_account_setting',
        'ledger', 'controlling_area', 'cost_center', 'cost_center_account',
        'cost_center_account_group', 'profit_center', 'currency', 'country',
        'fiscal_year', 'fiscal_period', 'document_number_range',
        'payment_term', 'tax_account_key', 'tax_code', 'tax_type',
        'tolerance_config', 'reason_code',

        -- Material, inventory, purchasing, and business-partner masters
        'material', 'material_group', 'material_type', 'material_uom',
        'unit_of_measure', 'valuation_class', 'plant', 'storage_location',
        'movement_category', 'movement_reason', 'movement_type',
        'purchasing_group', 'supplier', 'supplier_bank_account',
        'supplier_material', 'customer', 'quality_inspector',

        -- Fixed-asset master/configuration (NOT asset records or postings)
        'asset_book', 'asset_class', 'asset_class_depreciation_area',
        'asset_transaction_type', 'depreciation_method',
        'asset_account_determination',

        -- Integration, workflow, and approval configuration
        'integration_mapping_movement_type', 'integration_mapping_tax',
        'integration_mapping_valuation_class',
        'process', 'subprocess', 'workflow_definition', 'workflow_phase',
        'workflow_step', 'approval_rule', 'approval_rule_purchasing_group',
        'approval_step', 'approving_group', 'approving_group_member'
    ];
    tables_to_clear text;
BEGIN
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY tablename)
      INTO tables_to_clear
      FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename <> ALL (preserved_tables);

    IF tables_to_clear IS NULL THEN
        RAISE EXCEPTION 'No tables selected for reset.';
    END IF;

    RAISE NOTICE 'Clearing transactional tables: %', tables_to_clear;
    EXECUTE 'TRUNCATE TABLE ' || tables_to_clear || ' RESTART IDENTITY';
END
$reset$;

-- Inspect the result before making it permanent.
-- If the counts look correct, run COMMIT; otherwise run ROLLBACK.
-- COMMIT;
-- ROLLBACK;
