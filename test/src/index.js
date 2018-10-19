const { getChromeDriverVersion } = require('../../dist');

function run() {
  getChromeDriverVersion().then(result => {
    console.log('Run success');
    console.log(result);
  }).catch(err => {
    console.log('Run error');
    console.error(err);
  });
}

run();
