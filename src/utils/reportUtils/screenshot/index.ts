import puppeteer, { Browser, Page } from "puppeteer-core";
import fs from "fs/promises";
import path from "path";
import { pino } from "pino";
import { DirPath, Directory } from "../../../constants";

export interface IPieChartData {
  name: string;
  color: string;
  percent: number;
}

export interface IBarChartData {
  name: string;
  UnderConstruction: number;
  Empty: number;
  Constructed: number;
}

export class ScreenshotGenerator {
  browser: Browser;
  chartPage: Page;
  mapboxPage: Page;

  mapboxHtml: string;
  chartHtml: string;

  logger: pino.Logger;

  static PIE_CHART = "pie chart";
  static BAR_CHART = "bar chart";

  constructor(logger: pino.Logger) {
    this.logger = logger;
  }

  async loadHtmlToPage(page: Page, html: string) {
    await page.goto(`data: text/html, ${html}`);
    await page.setContent(html);
    await page.setViewport({width: 1920, height: 1080});
    await page.emulateMediaType("screen");
  }

  async init() {
    // Launch the browser instance
    try {
      this.browser = await puppeteer.launch({
        executablePath: "/usr/bin/google-chrome",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
        headless: true,
      });
    } catch (error) {
      this.logger.error("Error while launching browser for screenshots: ");
      this.logger.error(error);
    }

    // Open the pages

    try {
      this.mapboxHtml = await fs.readFile(
        path.join(__dirname, "templates", "mapbox.html"),
        "utf-8"
      );
      this.mapboxPage = await this.browser.newPage();
      this.mapboxPage
        .on('console', message =>
          this.logger.info(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
        .on('pageerror', ({ message }) => this.logger.error(message))
        .on('response', response =>
          this.logger.debug(`${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
          this.logger.warn(`${request.failure().errorText} ${request.url()}`));
      await this.loadHtmlToPage(this.mapboxPage, this.mapboxHtml);

      this.chartHtml = await fs.readFile(
        path.join(__dirname, "templates", "chart.html"),
        "utf-8"
      );
      this.chartPage = await this.browser.newPage();
      await this.loadHtmlToPage(this.chartPage, this.chartHtml);
    } catch (error) {
      this.logger.error("Error while loading html to puppeteer page: ");
      this.logger.error(error);
    }
  }

  async getChartSS(
    heading: string,
    data: IPieChartData[] | IBarChartData[],
    type: string
  ): Promise<Buffer> {
    try {
      await this.chartPage.evaluate(
        (heading, data, type) => {
          document.getElementById("chart").innerHTML = "";
          document.getElementById("labels").innerHTML = "";
          window.setHeading(heading);
          if (type === "pie chart") {
            window.genPieChart(data);
          } else {
            window.genBarChart(data);
          }
        },
        heading,
        data,
        type
      );
      const pngBuff = await this.chartPage.screenshot({ type: "png" });
      return pngBuff;
    } catch (error) {
      this.logger.error("Error while generating chart screenshot: ");
      this.logger.error(error);
    }
  }

  async getMapSS(cogServerUrl: string, vectorFilePaths: string[], rasterFilePaths: string[]) {
    try {
      await this.loadHtmlToPage(this.mapboxPage, this.mapboxHtml); // refreshing the page kindof
      this.logger.info({cogServerUrl, rasterFilePaths, vectorFilePaths}, "GENERATING SCREENSHOT, TAKE COVER!!!");
      await this.mapboxPage.evaluate(
        async ({ cogServerUrl, vectorFilePaths, rasterFilePaths }) => {
          await takeScreenshot(cogServerUrl, [...rasterFilePaths, "http://server:5011/raster/Ortho_25cm.tif"], vectorFilePaths);
        }, { cogServerUrl, vectorFilePaths, rasterFilePaths });
      const pngBuffer = await this.mapboxPage.screenshot({type: "png"});
      await fs.writeFile(DirPath(Directory.IMAGE, vectorFilePaths.length + '-' + rasterFilePaths.length + Math.random() + '.png'), pngBuffer);
      return pngBuffer;
    } catch (error) {
      this.logger.error("Error while generating map screenshot: ");
      this.logger.error(error);
    }
  }

  async destroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
