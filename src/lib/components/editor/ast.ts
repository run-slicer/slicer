import type { SyntaxNode, Tree } from "@lezer/common";

const NODE_TYPES_OF_INTEREST = new Set([
    "LineComment",
    "BlockComment",
    "ModuleDeclaration",
    "MarkerAnnotation",
    "Identifier",
    "ScopedIdentifier",
    "Annotation",
    "AnnotationArgumentList",
    "AssignmentExpression",
    "FieldAccess",
    "IntegerLiteral",
    "FloatingPointLiteral",
    "BooleanLiteral",
    "CharacterLiteral",
    "StringLiteral",
    "TextBlock",
    "ClassLiteral",
    "PrimitiveType",
    "TypeName",
    "ScopedTypeName",
    "GenericType",
    "TypeArguments",
    "ArrayType",
    "ParenthesizedExpression",
    "ObjectCreationExpression",
    "ArgumentList",
    "FieldDeclaration",
    "Modifiers",
    "Definition",
    "ArrayInitializer",
    "MethodDeclaration",
    "TypeParameters",
    "TypeParameter",
    "TypeBound",
    "ReceiverParameter",
    "FormalParameter",
    "SpreadParameter",
    "Throws",
    "ClassDeclaration",
    "Superclass",
    "SuperInterfaces",
    "InterfaceTypeList",
    "InterfaceDeclaration",
    "ExtendsInterfaces",
    "ConstantDeclaration",
    "EnumDeclaration",
    "EnumConstant",
    "AnnotationTypeDeclaration",
    "AnnotationTypeElementDeclaration",
    "StaticInitializer",
    "ConstructorDeclaration",
    "ExplicitConstructorInvocation",
    "ArrayAccess",
    "MethodInvocation",
    "MethodName",
    "MethodReference",
    "ArrayCreationExpression",
    "BinaryExpression",
    "InstanceofExpression",
    "LambdaExpression",
    "InferredParameters",
    "TernaryExpression",
    "UpdateExpression",
    "UnaryExpression",
    "CastExpression",
    "ElementValuePair",
    "ModuleDirective",
    "PackageDeclaration",
    "ImportDeclaration",
    "ExpressionStatement",
    "LabeledStatement",
    "Label",
    "IfStatement",
    "WhileStatement",
    "ForStatement",
    "LocalVariableDeclaration",
    "EnhancedForStatement",
    "AssertStatement",
    "SwitchStatement",
    "SwitchLabel",
    "DoStatement",
    "BreakStatement",
    "ContinueStatement",
    "ReturnStatement",
    "SynchronizedStatement",
    "ThrowStatement",
    "TryStatement",
    "CatchClause",
    "CatchFormalParameter",
    "CatchType",
    "FinallyClause",
    "TryWithResourcesStatement",
    "ResourceSpecification",
    "Resource",
]);

const NODE_PARENTS_OF_INTEREST = new Set(["TypeName", "ScopedTypeName", "ScopedIdentifier", "MethodName"]);

export const mostRelevantNode = (tree: Tree, pos: number): SyntaxNode | null => {
    let node: SyntaxNode | null = tree.resolveInner(pos);
    while (node) {
        if (NODE_TYPES_OF_INTEREST.has(node.type.name)) {
            break;
        }
        node = node.parent;
    }

    switch (node?.type.name) {
        case "Identifier":
        case "TypeName": {
            let parentNode: SyntaxNode | null = node.parent;
            while (parentNode) {
                if (NODE_PARENTS_OF_INTEREST.has(parentNode.type.name)) {
                    node = parentNode;
                }
                parentNode = parentNode.parent;
            }
            break;
        }
    }

    return node;
};
