MOCHA := node_modules/mocha/bin/mocha

REPORTER ?= spec

test:
	@$(MOCHA) test

.PHONY: test
