-- ============================================
-- ACCOUNT INVITATIONS TABLE
-- ============================================
-- Manages invitation lifecycle for joining accounts
-- Supports accept, decline, revoke, and automatic expiry

CREATE TABLE account_invitations (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	email TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'member',    -- owner, admin, member, buyer, noaccess
	invited_by_user_id TEXT NOT NULL REFERENCES users(id),
	sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	accepted_at DATETIME,
	declined_at DATETIME,
	revoked_at DATETIME,
	expires_at DATETIME NOT NULL,
	UNIQUE(account_id, email)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_invitations_email ON account_invitations(email);
CREATE INDEX idx_invitations_account ON account_invitations(account_id);
