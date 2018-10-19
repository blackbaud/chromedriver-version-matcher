
import * as fs from 'fs-extra';
import * as path from 'path';
import * as request from 'request';
import * as parser from 'xml2js';

const CHROMEDRIVER_V_PREFIX = '----------ChromeDriver v';
const SUPPORTS_CHROME_PREFIX = 'Supports Chrome v';

function getLatestChromeDriverVersion(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    request(
      'https://chromedriver.storage.googleapis.com/',
      (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          parser.parseString(body, (err, results) => {
            if (err) {
              reject(err);
            } else {
              const versionNumbers = results.ListBucketResult.Contents
                .filter((contents: any) => {
                  return contents.Key[0].indexOf('/notes.txt') >= 0;
                })
                .map((contents: any) => {
                  return contents.Key[0].split('/')[0];
                })
                .sort((a: string, b: string) => {
                  const aMinorVersion = +a.split('.')[1];
                  const bMinorVersion = +b.split('.')[1];

                  if (aMinorVersion < bMinorVersion) {
                    return 1;
                  }

                  if (bMinorVersion < aMinorVersion) {
                    return -1;
                  }

                  return 0;
                });

              resolve(versionNumbers[0]);
            }
          });
        }
      }
    );
  });
}

async function getReleaseNotes(latestChromeDriverVersion: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    request(
      'https://chromedriver.storage.googleapis.com/' +
        latestChromeDriverVersion +
        '/notes.txt',
      (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      }
    );
  });
}

function generateIndexFromReleaseNotes(releaseNotes: string) {
  // Look for lines in the release notes that look like this, then parse out the mentioned versions:
  // ----------ChromeDriver v2.43 (2018-10-16)----------
  // Supports Chrome v69-71

  const index: any = {
    versions: []
  };

  const lines = releaseNotes.split('\n');

  for (let i = 0, n = lines.length; i < n; i++) {
    const line = lines[i];

    if (line.indexOf(CHROMEDRIVER_V_PREFIX) === 0) {
      const chromeDriverVersion = line.substr(CHROMEDRIVER_V_PREFIX.length).split(' ')[0];

      const chromeVersionLine = lines[i + 1];

      const supportedMinMax = chromeVersionLine.substr(SUPPORTS_CHROME_PREFIX.length).split('-');

      const chromeMinVersion = +supportedMinMax[0];
      const chromeMaxVersion = +supportedMinMax[1];

      index.versions.push({
        chromeDriverVersion,
        chromeMaxVersion,
        chromeMinVersion
      });
    }
  }

  return index;
}

async function buildVersionIndex() {
  const latestVersion = await getLatestChromeDriverVersion();
  const releaseNotes = await getReleaseNotes(latestVersion);

  const index = generateIndexFromReleaseNotes(releaseNotes);

  return fs.writeJson(
    path.join(
      __dirname,
      '..',
      'src',
      'version-index.json'
    ),
    index,
    {
      spaces: 2
    }
  );
}

buildVersionIndex();
