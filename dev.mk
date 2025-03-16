.PHONY: dump-exercises
dump-exercises:
	@echo "Dumping exercises into local seed file"
	PGPASSWORD=postgres ./scripts/dump_exercises.sh

.PHONY: dev-fresh-db
dev-fresh-db: dump-exercises
	@echo "Creating fresh database"
	supabase db reset



