import atomist from "@atomist/automation-client";
import mg from "@atomist/microgrammar";
const projectUtils = atomist.projectUtils;
const parseUtils = atomist.parseUtils;

// Sample microgrammar: 
// public static final ${type} ${name} = ${valueExpression};
const sampleMicrogrammar = new mg.Microgrammar({
    public: "public",
    static: mg.optional("static"), // optional, zeroOrMore, atLeastOne, Repetition...
    final: mg.optional("final"),
    type: /[a-zA-Z_$][a-zA-Z0-9_$]+/,
    name: /[a-zA-Z_$][a-zA-Z0-9_$]+/,
    equal: "=",
    valueExpression: /[^;]+/,
    end: ";"
});

async function main() {
    const project = new atomist.NodeFsLocalProject("", "C:/backup/personal projects/test-atomist/data/commons-io-2/");
    
    const fileAndLineCountArray = await projectUtils.gatherFromFiles(project, ["**/*.java"], async file => {
        const content = await file.getContent();
        const lines = content.split("\n").length;
        return `${file.path}: ${lines} lines`;
    });

    fileAndLineCountArray.forEach(f => console.log(f));

    await projectUtils.doWithFiles(project, "**/FileUtils.java", async file => {
        await file.replaceAll("FileUtils", "FileUtils2");
        await project.addFile(file.path.replace("FileUtils", "FileUtils2"), await file.getContent());
        await file.rename("FileUtils.java.old");
    });

    await projectUtils.deleteFiles(project, "**/commons/io/comparator/**");

    const matches = await parseUtils.findMatches(project, "**/FileUtils2.java", sampleMicrogrammar);

    matches.forEach(m => console.log(`${m.name} = ${m.valueExpression} (tipo ${m.type})`));

    await parseUtils.doWithMatches(project, "**/FileUtils2.java", sampleMicrogrammar, m => {
        if (m.type == "long") {
            m.type = "Long";
            console.log(`Updating type of ${m.name} to Long`);     
        }
    });
};

main();


