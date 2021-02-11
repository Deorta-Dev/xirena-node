const {Reflection, AbstractAnnotation} = require('../index');

class Example {

    /*
    @Execute( 'gola')
     */
    executeAction(a, b , c = 0){

    }
}
class ExecuteAnnotation extends AbstractAnnotation{
    build() {
        super.build();
    }
}

test('ckeck of reflection class', () => {
    let annotations = {
        "Execute": new ExecuteAnnotation()
    }
    let results = Reflection.getClassAnnotations(Example, annotations);
    expect(JSON.stringify(results)).toBe(`[{"annotation":"@Execute( 'gola')","fn":"executeAction","args":["a","b","c"]}]`);
});