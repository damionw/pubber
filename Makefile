.PHONY: clean demo_support

ORDERED_COMPONENTS_LIST := \
	src/pubber-messaging.js

all: build/static/pubber.js

demo_support: all
	@cp examples/* build/static/

build/static/pubber.js: src/*.js build/static
	@(echo '"use strict"'";\n"; for name in $(ORDERED_COMPONENTS_LIST); do cat $${name}; echo '\n'; done) > $@

build/static:
	@mkdir -p $@

clean:
	-@rm -rf build checkouts downloads
