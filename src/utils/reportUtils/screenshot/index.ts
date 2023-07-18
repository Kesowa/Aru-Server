import puppeteer, { Browser, Page } from 'puppeteer-core';
import fs from "fs/promises";
import path from "path";

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

    static PIE_CHART = "pie chart";
    static BAR_CHART = "bar chart";

    async init() {
        // Launch the browser instance
        this.browser = await puppeteer.launch({
            executablePath: "/usr/bin/google-chrome",
            args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
            ],
            headless: true,
        });

        async function loadHtmlToPage(page: Page, html: string) {
            await page.goto(`data: text/html, ${html}`, { 
                waitUntil: "networkidle0" 
            });
            await page.setContent(html);
            await page.emulateMediaType("screen");
        }

        // Open the pages

        try {
            const mapboxHtml = await fs.readFile(path.join(__dirname, "templates", "mapbox.html"), "utf-8");
            this.mapboxPage = await this.browser.newPage();
            await loadHtmlToPage(this.mapboxPage, mapboxHtml);
    
            const chartHtml = await fs.readFile(path.join(__dirname, "templates", "chart.html"), "utf-8");
            this.chartPage = await this.browser.newPage();
            await loadHtmlToPage(this.chartPage, chartHtml);
        } catch(error) {
            console.error(error);
            await this.browser.close();
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
            console.error(error);
            await this.destroy();
        }
    }

    async getMapSS(cogServerUrl: string, vectorFilePaths: string[]) {
        try {
            await this.mapboxPage.evaluate((cogServerUrl, vectorFilePaths) => {
                window.isMapLoaded = false;
        
                window.setupMap("map", cogServerUrl).then(() => {
                    // Render all given geojsons
                    window.renderVector(vectorFilePaths).then(() => {
                        window.setTimeout(() => {
                            window.isMapLoaded = true; // map loaded and stabilized (all transition animations over)
                        }, 7000);
                    }).catch(console.error);
                })
                .catch((error: any) => console.error("Error loading map", error));
            }, cogServerUrl, vectorFilePaths);
            await this.mapboxPage.waitForFunction("window.isMapLoaded === true"); // wait for mapbox to load up and stablizie the map
            const pngBuff = await this.mapboxPage.screenshot({ type: "png" });
            return pngBuff;
        } catch(error) {
            console.error(error);
            await this.destroy();
        }
    }

    async destroy() {
        if(this.browser) {
            await this.browser.close();
        }
    }
};