export namespace main {
	
	export class AppState {
	    lastDirectory: string;
	    windowWidth: number;
	    windowHeight: number;
	    sidebarWidth: number;
	    isSidebarCollapsed: boolean;
	    theme: string;
	
	    static createFrom(source: any = {}) {
	        return new AppState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lastDirectory = source["lastDirectory"];
	        this.windowWidth = source["windowWidth"];
	        this.windowHeight = source["windowHeight"];
	        this.sidebarWidth = source["sidebarWidth"];
	        this.isSidebarCollapsed = source["isSidebarCollapsed"];
	        this.theme = source["theme"];
	    }
	}
	export class ExcalidrawFile {
	    name: string;
	    path: string;
	    // Go type: time
	    modified: any;
	    hasChanges: boolean;
	    isNew: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ExcalidrawFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.modified = this.convertValues(source["modified"], null);
	        this.hasChanges = source["hasChanges"];
	        this.isNew = source["isNew"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

