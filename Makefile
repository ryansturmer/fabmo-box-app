fabmo-boxcutter-app.fma: clean *.html js/*.js js/lib/*.js css/*.css fonts/* img/*.png icon.png package.json
	zip fabmo-boxcutter-app.fma *.html js/*.js js/lib/*.js css/*.css fonts/* img/*.png icon.png package.json

.PHONY: clean

clean:
	rm -rf fabmo-boxcutter-app.fma
