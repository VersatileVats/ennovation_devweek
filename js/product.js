document.querySelector("#brandName").textContent = window.sessionStorage.getItem("brand")

async function serverCall(request, endpoint) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify(request);

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    return await fetch(`${SERVER}${endpoint}`, requestOptions)
    .then(response => response.text())
    .then(result => {return result})
    .catch(error => {return `ERROR:Server error`});
}

document.querySelector("#addProductBtn").addEventListener("click", (el) => {
    // el.target.style.display = "none"
    if(document.querySelector("#addProductForm").style.display === "none") {
        document.querySelector("#addProductForm").style.display = "block"
    } else {
        document.querySelector("#addProductForm").style.display = "none"
    }
})

//product addition request
document.querySelector("#submitProduct").addEventListener("click", async (el) => {
    el.preventDefault()
    const formField = ["productTitle", "productDesc","productPrice"]
    
    for(let a =0; a<formField.length; a++) {
        if(document.querySelector(`#${formField[a]}`).value === "") {
            document.querySelector("#productError").style.visibility = "visible"
            document.querySelector("#productError").textContent = "Please provide all required fields"
            return
        }
    }
    
    // ensuring that the values are not empty
    if(document.querySelector("#gender").value === "default") {
        document.querySelector("#productError").style.visibility = "visible"
        document.querySelector("#productError").textContent = "Choose a valid value for gender"
    }

    else if(document.querySelector("#ageGroup").value === "default") {
        document.querySelector("#productError").style.visibility = "visible"
        document.querySelector("#productError").textContent = "Choose a valid value for age group"
    }
    
    else if(document.querySelector("#productImage").files[0]) {
        document.querySelector("#productError").style.visibility = "hidden"

        const mlLabel = document.querySelector("#mlLabel")
        const newLabel = document.querySelector("#newLabel")
        let labelValue = ""
        
        // checking the ML_GENERATED label for the  image
        if(mlLabel.parentElement.parentElement.parentElement.lastElementChild.lastElementChild.lastElementChild.style.display != "block") {
            console.log("Fetching the value from the ML Label")
            labelValue = mlLabel.textContent
        } 
        // user has opted to enter its own label
        else {
            console.log("Fetching the value from the New Label")
            labelValue = newLabel.value
            
            if(labelValue == '') {
                document.querySelector("#productError").style.visibility = "visible"
                document.querySelector("#productError").textContent = "Provide a label!"
                return 
            }
            
            // add the new label to the labels.txt file
            fetch(`https://versatilevats.com/openshift/updateLabels.php?label=${labelValue}`)
        }
        console.log(labelValue)
        
        const pName = document.querySelector("#productTitle").value
        const pAgeGroup = document.querySelector("#ageGroup").value
        const pDesc = document.querySelector("#productDesc").value
        const pGender = document.querySelector("#gender").value
        const bEmail = window.sessionStorage.getItem("email")
        
        var formdata = new FormData();
        formdata.append("productImg", document.querySelector("#productImage").files[0]);
        formdata.append("email",  bEmail)

        var requestOptions = {
            method: 'POST',
            body: formdata,
            redirect: 'follow'
        };

        document.querySelector("#loading").style.display = "flex"
        document.querySelector(".page-section").style.display = "none"
        document.querySelector("#loadingText").textContent = "Creating the product card"

        const productName = document.querySelector("#productTitle").value.replaceAll(" ", "")
        const pLoc = await fetch(`https://versatilevats.com/ennovation/server.php?action=uploadProductImage&productName=${productName}`, requestOptions)
            .then(response => response.text())
            .then(result => result)
            .catch(error => console.log('error', error));
        const pPrice = Number(document.querySelector("#productPrice").value);
        
        const pickup = document.querySelector("#productPickup").checked
        
        const insertRes = await serverCall({
            "pName"      : pName,
            "bEmail"     : bEmail,
            "pDesc"      : pDesc,
            "pGender"    : pGender,
            "pAgeGroup"  : pAgeGroup,
            "pLoc"       : pLoc,
            "pPrice"     : pPrice,
            "pickup"     : pickup,
            "label"      : labelValue
        }, "/addProduct");

        console.log(insertRes);

        if(insertRes.includes("ERROR")) {
            document.querySelector("#loading").style.display = "none";
            document.querySelector(".page-section").style.display = "block";
            document.querySelector("#productError").style.visibility = "visible";
            
            if(insertRes.includes("purchase link only!!")) {
                document.querySelector("#productError").textContent = insertRes.split("ERROR:")[1]
            } 
            else document.querySelector("#productError").textContent = insertRes.split(":")[1];
            
            var deleteOptions = {
              method: 'GET',
              redirect: 'follow'
            };
            
            await fetch(`https://versatilevats.com/ennovation/server.php?action=unlink&file=${pLoc.split(".com")[1]}`, deleteOptions);
        } else {
            location.reload()   
        }
    }

    else {
        document.querySelector("#productError").style.visibility = "visible";
        document.querySelector("#productError").textContent = "No image uploaded!!";
    }
})

async function populateProducts() {
    let products = await serverCall({
        "email": window.sessionStorage.getItem("email")
    }, "/fetchProducts");

    document.querySelector("#loading").style.display = "none";
    document.querySelector(".page-section").style.display = "block";

    if(products.includes("ERROR")) {
        document.querySelector("#productCards").innerHTML = 
        `<div class="col-lg-4 col-sm-6 m-auto mb-4">
            <div class="portfolio-item">
                <div class="portfolio-caption">
                    <div class="portfolio-caption-heading">0 products have been added</div>
                    <div class="portfolio-caption-subheading text-muted">Click on Add More to get started</div>
                </div>
            </div>
        </div>`;
    } else {
        products = JSON.parse(products)
        for(let product in products) {
            
            let gender = products[product].pGender;
            if(gender === "f") gender = "Female"
            else if(gender == "m") gender = "Male"
            else gender = "Male & female"
            
            let ageGroup = products[product].pAgeGroup;
            if(ageGroup === "kids") ageGroup = "Kids"
            else if(ageGroup === "adult") ageGroup = "Adults"
            else if(ageGroup === "old") ageGroup = "Old"
            else ageGroup = "Everyone"
            
            // checking the PICKUP attribute for a product
            let pickupImg = ""
            if(products[product].pickup) {
                pickupImg = `<img width="40" height="40" src="https://img.icons8.com/cotton/40/pickup.png" alt="pickup"/>`
            }
            
            document.querySelector("#productCards").innerHTML += 
            `<div class="col-lg-4 col-sm-6 m-auto mb-4">
                <div class="portfolio-item">
                    <a class="portfolio-link" style="display: flex; justify-content: center; position: relative">
                        <div class="portfolio-hover">
                            <div class="portfolio-hover-content"><span id="delete" style="cursor: pointer"><i class="fas fa-trash fa-3x"></i></span></div>
                        </div>
                        <img class="img-fluid" style="height:300px;" src="${products[product].pLoc}" />
                        <p style="position: absolute; top: 0; left: 0; border: 2px dashed black; border-radius: 5px; padding: 2px; font-weight: bold; color: black">$ ${products[product].pPrice}</p>
                    </a>
                    <div class="portfolio-caption" style="background: none">
                        <div class="portfolio-caption-heading">${products[product].pName}</div>
                        <div class="portfolio-caption-subheading text-muted">${pickupImg} ${products[product].pDesc}</div>
                        <p style="font-size: 0.8rem;" class="pt-1">
                            <span style="float: left">Gender: ${gender}</span>
                            <span style="float: right">Age group: ${ageGroup}</span>
                        </p>
                    </div>
                </div>
            </div>`
        }
        document.querySelectorAll("#delete").forEach(node => {
            node.addEventListener("click", async (el) => {
                const userChoiceDelete = prompt("Do you want to delete the product?", "No", "Yes")
                if( userChoiceDelete != null && userChoiceDelete.toLowerCase() === "yes") {
                    
                    document.querySelector("#loading").style.display = "flex"
                    document.querySelector(".page-section").style.display = "none"
                    document.querySelector("#loadingText").textContent = "Deleting the product"
                    
                    const del = await serverCall({
                        "pName": node.parentElement.parentElement.parentElement.parentElement.lastElementChild.firstElementChild.textContent,
                        "bEmail": window.sessionStorage.getItem("email"),
                        "pLoc": node.parentElement.parentElement.parentElement.parentElement.firstElementChild.querySelector("img").src
                    }, "/deleteProduct")
                    
                    // unlinking the image
                    var requestOptions = {
                      method: 'GET',
                      redirect: 'follow'
                    };
                    
                    await fetch(`https://versatilevats.com/ennovation/server.php?action=unlink&file=${(node.parentElement.parentElement.parentElement.parentElement.firstElementChild.querySelector("img").src).split(".com")[1]}`, requestOptions)
                    
                    if(del.includes("ERROR")) {
                        alert(del.split(":")[1])
                    } else location.reload()
                    
                }   
            })
        })
    }
}

// handling the image change event and run the ML inference on the uploaded image to get the result of Clip-zero-shot-image classification model
document.querySelector("#productImage").addEventListener("change", async (event)=> {
    // checking the labels only when the image is there

    const mlLabel = document.querySelector("#mlLabel")
    mlLabel.parentElement.parentElement.parentElement.style.display = "none"
    mlLabel.parentElement.parentElement.parentElement.firstElementChild.style.display = "block"
    mlLabel.parentElement.parentElement.parentElement.lastElementChild.style.display = "none"
    mlLabel.parentElement.parentElement.parentElement.lastElementChild.firstElementChild.style.display = "block"
    mlLabel.parentElement.parentElement.parentElement.lastElementChild.lastElementChild.firstElementChild.style.display = "none"
    
    document.querySelector("#submitProduct").style.display = "none"
    
    document.querySelector("body").style.pointerEvents = "none"
    if(event.target.files.length) {
        const bEmail = window.sessionStorage.getItem("email")
        
        let formdata = new FormData();
        formdata.append("productImg", event.target.files[0]);
        // formdata.append("productImg", document.querySelector("#productImage").files[0]);
        formdata.append("email",  bEmail)

        var requestOptions = {
            method: 'POST',
            body: formdata,
            redirect: 'follow'
        };

        const productName = document.querySelector("#productTitle").value.replaceAll(" ", "")
        
        // Step1: Save the uploaded image to the openshift/temp folder
        const tmpFileName = await fetch(`https://versatilevats.com/ennovation/server.php?action=runMLInference&productName=${productName}`, requestOptions)
            .then(response => response.text())
            .then(result => result)
            .catch(error => console.log('error', error));

        console.log(`Temp file name is: ${tmpFileName}`)

        // Step2: Run the inference on the image URL via the NODE application
        console.log(`Calling ${MODEL}?image=${tmpFileName}`)
        const res = await fetch(`${MODEL}?image=${tmpFileName}`)
            .then(data => data.json())
            .then(data => {
                console.log(data)
                return data
            })

        // fetched the results, so delete the temp image file uploaded to the server:
        console.log(`Deleting: https://versatilevats.com/ennovation/server.php?file=https://versatilevats.com/openshift/tmp/${tmpFileName}`)
        fetch(`https://versatilevats.com/ennovation/server.php?action=unlinkMLImages&image=${tmpFileName}`)
        
        let returnString = ""
        let errorString = ""
    
        // A single key-value object will be returned from the flask application
        // The label will be having greater than 80% probability
        Object.entries(res).forEach(([key, value]) => {
            if(key != "Error") {
                console.log(`${key.toUpperCase()} : ${(value*100).toFixed(1)} %`)
                returnString = `${key.toUpperCase()}`
            } else {
                if(value != "No labels can be found!")
                    errorString = value
            }
        })
        console.log(res)
        console.log(`Output of the AI model call. Return String is: ${returnString} & errorString is: ${errorString}`)
        
        // if the string is empty, then there is an error
        if(returnString == "" && errorString != "") {
            console.log("ML Model Processing Error")
            console.log(errorString)
            document.querySelector("#productError").style.visibility = "visible"
            document.querySelector("#productError").textContent = errorString
        }
        // No lables can be found for the particular image
        else if(errorString == "" && returnString == "") {
            mlLabel.parentElement.parentElement.parentElement.style.display = "block"
            mlLabel.parentElement.parentElement.parentElement.firstElementChild.style.display = "none"
            mlLabel.parentElement.parentElement.parentElement.lastElementChild.style.display = "block"
            mlLabel.parentElement.parentElement.parentElement.lastElementChild.lastElementChild.firstElementChild.style.display = "block"
            mlLabel.parentElement.parentElement.parentElement.lastElementChild.firstElementChild.textContent = "No object found, provide your own label"

            document.querySelector("#productError").style.visibility = "hidden"
            document.querySelector("#submitProduct").style.display = "block"
        }
        // no error is there, everything is working as intended
        else if(errorString == "" || returnString != "") {
            console.log("No ML-Processing Error")
            
            document.querySelector("#productError").style.visibility = "hidden"
            document.querySelector("#submitProduct").style.display = "block"
            
            // make the label visible to the user
            mlLabel.parentElement.parentElement.parentElement.style.display = "block"
            mlLabel.textContent = returnString
            
            mlLabel.parentElement.parentElement.parentElement.lastElementChild.style.display = "block"

            mlLabel.parentElement.parentElement.parentElement.lastElementChild.firstElementChild.textContent = "If the tag is wrong, then please delete it & write the new one"
        }
    }

    document.querySelector("body").style.pointerEvents = "auto"
})

// handling deletion of the label
document.querySelector("#delLabel").addEventListener("click", (event) => {
    event.target.parentElement.parentElement.style.display = "none"
    document.querySelector("#newLabel").style.display = "block"
})

// resetting the form on reload
window.onload = function() {
    document.getElementById("addProductForm").reset();
};

// fetching the product details
window.addEventListener("load", populateProducts())
