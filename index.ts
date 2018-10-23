import * as chromeFinder from 'chrome-launcher/dist/src/chrome-finder';
import * as chromeUtils from 'chrome-launcher/dist/src/utils';
import * as spawn from 'cross-spawn';
import * as fs from 'fs-extra';
import * as path from 'path';

import {
  ChromeDriverVersionMatch
} from './src/version-match';

import {
  ChromeDriverVersionIndex
} from './src/version-index';

function getMajorFromVersion(version: string): number {
  return +version.split('.')[0];
}

async function getChromeMajorVersion(): Promise<{chromeVersion: string, chromeMajorVersion: number}> {
  const promise = new Promise<{chromeVersion: string, chromeMajorVersion: number}>((resolve, reject) => {
    const platform = chromeUtils.getPlatform();
    const installations = (chromeFinder as any)[platform]();

    console.log('Platform', platform);
    console.log('Chrome Installations', installations);

    if (installations && installations.length > 0) {
      if (platform === 'win32') {
        const source = spawn(
          'wmic',
          [
            'datafile',
            'where',
            `name='${installations[0].replace(/\\/g, '\\\\')}'`,
            'get',
            'version',
            '/value'
          ]
        );

        source.stdout.on('exit', () => reject('Unable to get Chrome version from wmic (exit)'));
        source.stdout.on('close', () => reject('Unable to get Chrome version from wmic (close)'));
        source.stderr.on('data', () => reject('Unable to get Chrome version from wmic (err)'));
        source.stdout.on('data', (data) => {

          const dataCleaned = data.toString().trim().toLowerCase();
          if (dataCleaned.indexOf('version=') > -1) {
            const chromeVersion = dataCleaned.split('version=')[1].split('wmic')[0].replace(/\r?\n|\r/g, '');
            resolve({
              chromeMajorVersion: getMajorFromVersion(chromeVersion),
              chromeVersion
            });
          }
        });
      } else {
        const source = spawn(installations[0], ['--version']);
        source.stdout.on('exit', () => reject('Unable to get Chrome version (exit)'));
        source.stdout.on('close', () => reject('Unable to get Chrome version (close)'));
        source.stderr.on('data', () => reject('Unable to get Chrome version (err)'));
        source.stdout.on('data', (data) => {
          const chromeVersion = data.toString()
            .trim().substr('Google Chrome '.length).split(' ')[0];
          resolve({
            chromeMajorVersion: getMajorFromVersion(chromeVersion),
            chromeVersion
          });
        });
      }
    } else {
      reject('No local installation of Chrome was found.');
    }
  });

  return promise;
}

async function getVersionIndex(): Promise<ChromeDriverVersionIndex> {
  return fs.readJson(
    path.join(
      __dirname,
      'src',
      'version-index.json'
    )
  );
}

async function getChromeDriverVersion(): Promise<ChromeDriverVersionMatch> {
  return new Promise<ChromeDriverVersionMatch>(async (resolve, reject) => {
    const results = await Promise.all(
      [
        getChromeMajorVersion(),
        getVersionIndex()
      ]
    );

    try {
      const chromeVersion = results[0];
      const versionIndex = results[1];

      const versionMatch = versionIndex.versions.find(
        (version) =>
          chromeVersion.chromeMajorVersion >= version.chromeMinVersion &&
            chromeVersion.chromeMajorVersion <= version.chromeMaxVersion
      );

      resolve({
        chromeDriverVersion: (versionMatch && versionMatch.chromeDriverVersion) || 'latest',
        chromeVersion: chromeVersion.chromeVersion
      });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

module.exports = {
  getChromeDriverVersion
};

// USAGE:
// getChromeDriverVersion().then(result => console.log(result));
