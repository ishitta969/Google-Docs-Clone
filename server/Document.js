const { Schema, model } = require("mongoose")

const RevisionSchema = new Schema({
  data: Object,
  timestamp: { type: Date, default: Date.now }
})

const Document = new Schema({
  _id: String,
  data: Object,
  title: String,
  revisions: [RevisionSchema]
}, { timestamps: true })

module.exports = model("Document", Document)
