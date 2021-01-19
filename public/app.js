document.addEventListener("DOMContentLoaded", function() {
	fetch("/api/all")
		.then(result => result.json())
		.then(data => {
			if (data.length) {
				console.log(data);
				createTable(data);
			}
		});
});

function createTable(data) {
	const main = document.querySelector("main");

	const tableSection = document.createElement("section");

	const table = document.createElement("table");
	
	const header = document.createElement("tr");
	
	const urlHeader = document.createElement("th");
	urlHeader.appendChild(document.createTextNode("URL"));

	const shortHeader = document.createElement("th");
	shortHeader.appendChild(document.createTextNode("short-url"));

	console.log(urlHeader);
	console.log(shortHeader);
	header.append(urlHeader);
	header.append(shortHeader);

	table.append(header);
	for (let eachData in data) {
		let row = document.createElement("tr");

		let urlData = document.createElement("td");
		urlData.appendChild(document.createTextNode(data[eachData].url));

		let shortURLData = document.createElement("td");
		let shortLink = document.createElement("a");
		shortLink.target = "_blank";
		shortLink.href= "/api/shorturl/" + data[eachData].shortURL;
		shortLink.appendChild(document.createTextNode(data[eachData].shortURL));
		shortURLData.appendChild(shortLink);

		row.appendChild(urlData);
		row.appendChild(shortURLData);

		table.appendChild(row);
	}

	tableSection.appendChild(table);
	main.appendChild(tableSection);
}