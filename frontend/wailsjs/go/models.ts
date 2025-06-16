export namespace main {
	
	export class Config {
	    Provider: string;
	    Model: string;
	    APIBaseURL: string;
	    APIKey: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Provider = source["Provider"];
	        this.Model = source["Model"];
	        this.APIBaseURL = source["APIBaseURL"];
	        this.APIKey = source["APIKey"];
	    }
	}

}

