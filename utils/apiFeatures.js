class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString } //queryObj = this.query will assign reference .By doing this we are assigning an object to queryObj
        const excludedFields = ['page', 'sort', 'limit', 'fields'] //Exclude coz they are handled separately 
        excludedFields.forEach(el => delete queryObj[el]) //delete excluded fields from queryObj

        //1B . AdvancedQuery
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        //Mongoose query method #3
        //EXECUTE QUERY
        this.query = this.query.find(JSON.parse(queryStr))

        return this
    }

    sort() {
        if (this.queryString.sort) {
            console.log(this.queryString)
            const sortBy = this.queryString.sort.split(',').join(' ') //Coz mongoose expects them separeated by spaces
            this.query = this.query.sort(sortBy)
        }
        else {
            this.query = this.query.sort('-createdAt')
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        }
        else {
            this.query = this.query.select('-__v')
        }

        return this
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit //documents to skip to get the desired page
        this.query = this.query.skip(skip).limit(limit);

        return this
    }

}

module.exports = APIFeatures 
