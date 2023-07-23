import puppeteer, { Browser, Page } from 'puppeteer-core';
import fs from "fs/promises";
import path from "path";
import { pino } from 'pino';

export interface IPieChartData {
    name: string,
    color: string,
    percent: number,
};

export interface IBarChartData {
    name: string, 
    UnderConstruction: number, 
    Empty: number, 
    Constructed: number,
};

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
        await page.goto(`data: text/html, ${html}`, { 
            waitUntil: "networkidle0" 
        });
        await page.setContent(html);
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
                "--disable-dev-shm-usage"
                ],
                headless: true,
            });
        } catch(error) {
            this.logger.error("Error while launching browser for screenshots: ");
            this.logger.error(error);
        }

        // Open the pages

        try {
            this.mapboxHtml = await fs.readFile(path.join(__dirname, "templates", "mapbox.html"), "utf-8");
            this.mapboxPage = await this.browser.newPage();
            await this.loadHtmlToPage(this.mapboxPage, this.mapboxHtml);
    
            this.chartHtml = await fs.readFile(path.join(__dirname, "templates", "chart.html"), "utf-8");
            this.chartPage = await this.browser.newPage();
            await this.loadHtmlToPage(this.chartPage, this.chartHtml);
        } catch(error) {
            this.logger.error("Error while loading html to puppeteer page: ");
            this.logger.error(error);
        }

    }

    async getChartSS(heading: string, data: IPieChartData[] | IBarChartData[], type: string): Promise<Buffer> {
        try {
            await this.chartPage.evaluate((heading, data, type) => {
                document.getElementById("chart").innerHTML = "";
                document.getElementById("labels").innerHTML = "";
                window.setHeading(heading);
                if(type === "pie chart") {
                    window.genPieChart(data);
                } else {
                    window.genBarChart(data);
                }
            }, heading, data, type);
            const pngBuff = await this.chartPage.screenshot({ type: "png" });
            return pngBuff;
        } catch(error) {
            this.logger.error("Error while generating chart screenshot: ");
            this.logger.error(error);
        }
    }

    async getMapSS(cogServerUrl: string, vectorFilePaths: string[]) {
        try {
            await this.loadHtmlToPage(this.mapboxPage, this.mapboxHtml); // refreshing the page kindof
            await this.mapboxPage.evaluate((cogServerUrl, vectorFilePaths) => {
                document.getElementById("map").innerHTML = "";
                window.isMapLoaded = false;
                window.setupMap("map", cogServerUrl).then(() => {
                    // Render all given geojsons
                    window.renderVector(vectorFilePaths).then(() => {
                        window.setTimeout(() => {
                            window.isMapLoaded = true; // map loaded and stabilized (all transition animations over)
                        }, 7000);
                    }).catch(this.logger.error);
                })
                .catch((error: any) => this.logger.error("Error loading map", error));
            }, cogServerUrl, vectorFilePaths);
            await this.mapboxPage.waitForFunction("window.isMapLoaded === true"); // wait for mapbox to load up and stablizie the map
            const pngBuff = await this.mapboxPage.screenshot({ type: "png" });
            return pngBuff;
        } catch(error) {
            this.logger.error("Error while generating map screenshot: ");
            this.logger.error(error);
        }
    }

    async destroy() {
        if(this.browser) {
            await this.browser.close();
        }
    }
};