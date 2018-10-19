export interface ChromeDriverVersionIndex {
  versions: Array<{
    chromeDriverVersion: string,
    chromeMaxVersion: number,
    chromeMinVersion: number
  }>;
}
