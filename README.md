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

## Manually updating index

Until https://github.com/blackbaud/chromedriver-version-matcher/issues/11 is resolved, we must manually update the index.

- Visit https://chromedriver.storage.googleapis.com/.
- Find the version of Chrome you're wanting to add support for.
- Open `src/version-index.json` and add new entries.
