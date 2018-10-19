# chromedriver-version-matcher
A Node module that finds the version of ChromeDriver that is compatible with the locally-installed version of Chrome.

## Usage

```

const versionMatcher = require('chromedriver-version-matcher');

versionMatcher.getChromeDriverVersion()
  .then((result) => {
    console.log('Found Chrome version ' + result.chromeVersion);
    console.log('The compatible ChromeDriver version is ' + result.chromeDriverVersion);
  });

```