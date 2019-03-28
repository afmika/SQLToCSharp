	function majFirst(name) {
		var first = name.charAt(0).toUpperCase();
		var last = name.substring(1, name.length);
		return first + last;
	}
	
	function compact(sql) {
		var s = sql;
		//enleve les commentaires
		s = s.split(/--.+\n/gi).join("");
		//enleve les foreigns key
		s = s.split(/foreign.+/gi).join("");
		//enleve les primary key
		s = s.split(/primary key/gi).join("");
		//enleve les retours arrieres en trop et retracte les espaces
		s = s.split(/\n[\n ]+/gi).join("");
		//enleve les virgules orphelins
		//enleve les espaces apres la virgule finale au cas ou
		// s = s.split(/\ +/gi).join("");
		return s;
	}
	function deleteCrochet(sql) {
		return sql.split(new RegExp("[\\[\\]]", "gi")).join("");
	}
	function getTableName(sql) {
		//le seul mot entre "table" et "("
		sql = compact(sql);
		//on obtient "table Nomtable ("
		//on fait une recherche en arriere a partir de (
		var init = sql.split("(")[0].split(" ");
		// console.log(init);
		for(var i=init.length-1; i >= 0; i--) {
			if(init[i] != "") {
				return init[i]; //la premiere lettre non vide
			}
		}
		throw "Nom de table introuvable.";
	}

	function captureVariables(sql) {
		var s = compact(sql);
		//n importe quel caractere entre le premier ( et le dernier )
		var var_l = "";
		var posLast = sql.length;
		var posFirst = 0;
		for(var k=sql.length-1; k != 0; k--) {
			if(sql[k] == ")") {
				posLast = k;
				break;
			}
		}
		
		for(var i=0; i < sql.length; i++) {
			if(sql[i] == "(") {
				posFirst = i;
				break;
			}
		}
		
		for(var k=posFirst+1; k < posLast; k++) {
			var_l += sql[k];
		}
		
		var tab = var_l.split(",");
		var fin = [];
		for(var i=0; i < tab.length; i++) {
			//on supprime les espaces qui reviennent 2 à n fois
			tab[i] = tab[i].split(/[\t\n ]/gi).join(":");
			if(tab[i] != " ") {
				fin.push(tab[i]);
			}
		}
		// console.log(fin);
		return fin;		
	}

	function getCorrectTypeSQLtoCSHARP(type_sql) {
		//retourne le type correcte en csharp
		var type = type_sql.toLowerCase();

		var type_str = ["varchar", "char"];
		var type_int = ["int", "integer", "number"];
		var type_double = ["double"];
		var type_float = ["float"];
		var type_date = ["date", "time"];
		var type_datetime = ["datetime"];
		for(var i=0; i < type_str.length; i++) {
			if(type_str[i] == type) {
				return "string";
			}
		}
		
		for(var i=0; i < type_int.length; i++) {
			if(type_int[i] == type) {
				return "int";
			}
		}
		
		for(var i=0; i < type_double.length; i++) {
			if(type_double[i] == type) {
				return "double";
			}
		}
		
		for(var i=0; i < type_float.length; i++) {
			if(type_float[i] == type) {
				return "float";
			}
		}
		for(var i=0; i < type_date.length; i++) {
			if(type_date[i] == type) {
				return "Date";
			}
		}
		for(var i=0; i < type_datetime.length; i++) {
			if(type_datetime[i] == type) {
				return "DateTime";
			}
		}		
		return "string"; //inconnue lol.
	}
	
	function getCodeCSHARPByUsingTypes(tabName, varSql, typesSql) {
		// obtient le code csharp correspondant
		var $var = varSql;
		var types = [];
		for(var k=0; k < typesSql.length; k++) {
			types.push(getCorrectTypeSQLtoCSHARP(typesSql[k]));
		} 
		//on compare le nombre de variables et de types
		if(types.length != varSql.length) throw "Syntax Error. Please check your syntax";

		var csharp = "";
		var table = majFirst(tabName);
		
		csharp += "public class "+table+" {";

		// attributs en mode public pour faciliter les fonctions reflects
		for(var i=0; i < varSql.length; i++) {
			//initialiseur
			var initvalue = (types[i] == "string" || types[i] == "Date") ? "null" : 0;
			initvalue = (types[i] == "DateTime") ? "new DateTime()" : initvalue;
			csharp += "\n\tpublic " + types[i] + " " + $var[i] + " = "+initvalue+";";
		}
			csharp += "\n";		
		// constructeur vide
			csharp += "\n\tpublic "+ table + "() {}";
		// constructeur avec set
			csharp += "\n\tpublic "+ table + "(";
		for(var i=0; i < varSql.length; i++) {
			// arguments du constructeur
			csharp += types[i] + " " + $var[i];
			csharp += varSql.length != i + 1 ? ", " : "";
		}
			csharp += ") {";
		for(var i=0; i < varSql.length; i++) {
			// construction des sets
			var set = "Set"+majFirst($var[i])+"("+$var[i]+");";
			csharp += "\n\t\t" + set;
		}
			csharp += "\n\t}";	
		// creation des gets et sets
		//on fait les sets
			csharp += "\n";
		for(var i=0; i < varSql.length; i++) {
			// construction des sets
			var nom = majFirst($var[i]);
			csharp += "\n\tpublic void Set"+nom+"("+types[i]+" "+$var[i]+") {";
			csharp += "\n\t\tthis."+$var[i]+" = "+$var[i]+";";
			csharp += "\n\t}";
		}
		//on fait les gets
			csharp += "\n";
		for(var i=0; i < varSql.length; i++) {
			// construction des gets
			var nom = majFirst($var[i]);
			csharp += "\n\tpublic "+types[i]+" Get"+nom+"() {";
			csharp += "\n\t\treturn this."+$var[i]+";";
			csharp += "\n\t}";
		}
		//on fait le toString()
			csharp += "\n";
			csharp += "\n\tpublic override String ToString(){"
			csharp += "\n\t\treturn \"[";
		for(var i=0; i < varSql.length; i++) {
			// arguments du constructeur
			csharp += $var[i] + " = \"+" +$var[i]+"+\"";
			csharp += varSql.length != i + 1 ? ", " : "";
		}
			csharp += "]\";";
			csharp += "\n\t}";
		csharp += "\n}";
		return csharp;
	}
	
	function getTemplateFromSql(sql) {
		//retourne un objet JSON contenant le nom de table
		//les noms de variables et les types
		//variables separées de la forme nomvar:typevar
		var nomTab = getTableName(sql);
		var capturedVar = captureVariables(sql);
		var tabName = majFirst(nomTab);
		var eachVar = capturedVar;
		var types = [];
		var variables = [];
		for(var k=0; k < capturedVar.length; k++) {
			var tmp_tab = capturedVar[k].split(":");
			var pos = -1;
			for(var u=0; u < tmp_tab.length; u++) {
				if(tmp_tab[u] != "") {
					variables.push(tmp_tab[u]);
					pos = u;
					break;
				}
			}
			for(var u=0; u < tmp_tab.length; u++) {
				if(tmp_tab[u] != "" && pos != u) {
					types.push(tmp_tab[u]);
					break;
				}
			}
		}
		var json_data = {
			table : tabName,
			variables : variables,
			types : types
		};
		return json_data;
	}
	
	function trad(sql) {
		//fonction principale
		// sql -> csharp
		//on recupere les variables et nom de table
		sql = deleteCrochet(sql); // pour sql server
		var template = getTemplateFromSql(sql);
		//on fabrique le code csharp
		
		var csharp = getCodeCSHARPByUsingTypes(template.table, template.variables, template.types);
		return csharp;
	}
    function downloadText(filename, text) {
        var link = document.createElement('a'); //On crée un élément
        link.setAttribute('target', '_blank');
        if (Blob !== undefined) {
            var blob = new Blob([text], {
                type: 'text/plain'
            });
            link.setAttribute('href', URL.createObjectURL(blob));
        } else {
            link.setAttribute('href', 'data:text/plain,' + encodeURIComponent(text));
        }
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
	
	function transform() {
		var v = document.getElementById("code_sql").value;
		v = compact(v);
		// console.log(v);
		var code = "";
		try {
			code = trad(v);
			document.getElementById("code_result").value = code;
			// parseSql();
			return true;
		} catch(e) {
			console.log(e);
			document.getElementById("code_result").value = e;
			return false;
		}
	}
	
	function parseSql() {
		//prend tous les tables sql
		//une table c est un motif
		//qui commence par un create table et qui se termine par un )
		var v = document.getElementById("code_sql").value;
		var tabList = v.split(";");
		var table = /create[ \t]{1,}table[ \t]{1,}[0-9a-zA-Z_]+[ \t]*\([^]{1,}\)/gi;
		var n = 0;
		var result = "";
		for(var i=0; i < tabList.length; i++) {
			var result = v.match(tabList[i]);
			if(result != null) {
				//trad
				var sql = compact(tabList[i]);
				var code = trad(sql);
				result += "---------------------------------\n";
				result += code;
				n++;
			}
		}
		if(n == 0) return false; //no table found
		document.getElementById("code_result").value = result;	
		return true;
	}
	
	function transformAndDownload() {
		if(transform()) {
				var v = document.getElementById("code_sql").value;
				v = compact(v);
				var className = majFirst(getTableName(v));
				downloadText(className + ".cs", document.getElementById("code_result").value);
		}
	}