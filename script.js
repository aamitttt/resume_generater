

function generateCV(){

    let nameField = document.getElementById("nameField").value;
    let nameT1 = document.getElementById("nameT1");
    nameT1.innerHTML = nameField;

    //direct field
    document.getElementById("nameT2").innerHTML = nameField;

    document.getElementById("contactT").innerHTML = document.getElementById("contactField").value;


    document.getElementById("addressT").innerHTML = document.getElementById("addressField").value;


    document.getElementById("linkedT").innerHTML = document.getElementById("linkedField").value;

    document.getElementById("fbT").innerHTML = document.getElementById("fbField").value;

    document.getElementById("instaT").innerHTML = document.getElementById("instaField").value;

    //object

  
    document.getElementById("objectiveT").innerHTML = document.getElementById("objectiveField").value;
    document.getElementById("weT").innerHTML = document.getElementById("weField").value;
    document.getElementById("aqT").innerHTML = document.getElementById("aqField").value;
    document.getElementById("ptT").innerHTML = document.getElementById("pField").value;
    document.getElementById("rtT").innerHTML = document.getElementById("rField").value;
    

    let file = document.getElementById("imgField").files[0];
    let reader= new FileReader();
    reader.readAsDataURL(file);
    console.log(reader.result);
    reader.onloadend= function() {
        document.getElementById("imgTemplate").src=reader.result;
    }

    document.getElementById('cv-form').style.display = 'none';
    document.getElementById('cv-template').style.display = 'block';


}
function printCV() {
    window.print();
}

